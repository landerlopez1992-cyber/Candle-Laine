import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {svg} from '../assets/svg';
import {actions} from '../store/actions';
import {components} from '../components';
import {supabase} from '../supabaseClient';
import {useCountryStateCity} from '../hooks/useCountryStateCity';
import type {UserAddressRow} from '../types/address';
import {APP_PALETTE} from '../theme/appPalette';

type SelectOpt = {value: string; label: string};

type LocationState = {addressId?: string} | null | undefined;

export const AddANewAddress: React.FC = () => {
  const navigate = hooks.useNavigate();
  const location = hooks.useLocation();
  const dispatch = hooks.useDispatch();
  const {geo, loading: geoLoading} = useCountryStateCity();

  const editAddressId = (location.state as LocationState)?.addressId ?? undefined;

  const [label, setLabel] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [zip, setZip] = useState('');
  const [street, setStreet] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(Boolean(editAddressId));
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [prefillRow, setPrefillRow] = useState<UserAddressRow | null>(null);

  const appliedPrefillRef = useRef(false);
  const lastEditIdRef = useRef<string | undefined>(undefined);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (lastEditIdRef.current !== editAddressId) {
      lastEditIdRef.current = editAddressId;
      appliedPrefillRef.current = false;
    }
  }, [editAddressId]);

  useEffect(() => {
    if (editAddressId) {
      return;
    }
    setLabel('');
    setCountryCode('');
    setStateCode('');
    setMunicipality('');
    setZip('');
    setStreet('');
    setPrefillRow(null);
    setPrefillError(null);
    appliedPrefillRef.current = false;
  }, [editAddressId]);

  useEffect(() => {
    if (!editAddressId || !supabase) {
      setPrefillLoading(false);
      setPrefillRow(null);
      if (!editAddressId) {
        setPrefillError(null);
      }
      return;
    }
    let cancelled = false;
    setPrefillLoading(true);
    setPrefillRow(null);
    setPrefillError(null);
    void supabase
      .from('user_addresses')
      .select('*')
      .eq('id', editAddressId)
      .maybeSingle()
      .then(({data, error: qErr}) => {
        if (cancelled) {
          return;
        }
        setPrefillLoading(false);
        if (qErr || !data) {
          setPrefillError('Could not load this address.');
          setPrefillRow(null);
          return;
        }
        setPrefillRow(data as UserAddressRow);
      });
    return () => {
      cancelled = true;
    };
  }, [editAddressId]);

  useEffect(() => {
    if (!geo || !prefillRow || appliedPrefillRef.current) {
      return;
    }
    appliedPrefillRef.current = true;
    setLabel(prefillRow.label ?? '');
    setCountryCode(prefillRow.country_iso2 ?? '');
    setStateCode(prefillRow.state_code ?? '');
    setMunicipality(prefillRow.municipality ?? '');
    setZip(prefillRow.zip ?? '');
    setStreet(prefillRow.street ?? '');
  }, [geo, prefillRow]);

  const countryOptions: SelectOpt[] = useMemo(() => {
    if (!geo) {
      return [];
    }
    return geo.Country.getAllCountries()
      .map((c) => ({value: c.isoCode, label: c.name}))
      .sort((a, b) => a.label.localeCompare(b.label, 'en'));
  }, [geo]);

  const hasStates = useMemo(() => {
    if (!geo || !countryCode) {
      return false;
    }
    return geo.State.getStatesOfCountry(countryCode).length > 0;
  }, [geo, countryCode]);

  const stateOptions: SelectOpt[] = useMemo(() => {
    if (!geo || !countryCode) {
      return [];
    }
    return geo.State.getStatesOfCountry(countryCode)
      .map((s) => ({value: s.isoCode, label: s.name}))
      .sort((a, b) => a.label.localeCompare(b.label, 'en'));
  }, [geo, countryCode]);

  const cityOptions: SelectOpt[] = useMemo(() => {
    if (!geo || !countryCode) {
      return [];
    }
    const states = geo.State.getStatesOfCountry(countryCode);
    const dedupe = (list: {name: string}[]): SelectOpt[] => {
      const seen = new Set<string>();
      const out: SelectOpt[] = [];
      for (const c of list) {
        const n = c.name.trim();
        if (!n || seen.has(n)) {
          continue;
        }
        seen.add(n);
        out.push({value: n, label: n});
      }
      return out.sort((a, b) => a.label.localeCompare(b.label, 'en'));
    };
    if (states.length > 0) {
      if (!stateCode) {
        return [];
      }
      return dedupe(geo.City.getCitiesOfState(countryCode, stateCode));
    }
    const all = geo.City.getCitiesOfCountry(countryCode);
    return dedupe(all ?? []);
  }, [geo, countryCode, stateCode]);

  const municipalityMatchesSelect = useMemo(() => {
    if (!municipality.trim()) {
      return true;
    }
    return cityOptions.some((o) => o.value === municipality);
  }, [cityOptions, municipality]);

  const canUseCitySelect =
    cityOptions.length > 0 && municipalityMatchesSelect;

  const onCountryChange = (value: string) => {
    setCountryCode(value);
    setStateCode('');
    setMunicipality('');
  };

  const onStateChange = (value: string) => {
    setStateCode(value);
    setMunicipality('');
  };

  const isEditing = Boolean(editAddressId && prefillRow);

  const onSave = useCallback(async () => {
    setError(null);
    if (!supabase) {
      setError('Unavailable.');
      return;
    }
    const {data: auth} = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setError('Sign in to save an address.');
      return;
    }
    const l = label.trim();
    const z = zip.trim();
    const s = street.trim();
    const m = municipality.trim();
    if (!l || !countryCode || !z || !s) {
      setError('Please fill in label, country, zip code, and street.');
      return;
    }
    if (hasStates && !stateCode) {
      setError('Please select a state / region.');
      return;
    }
    if (!m) {
      setError('Please select or enter a municipality / city.');
      return;
    }
    if (editAddressId && !prefillRow) {
      setError('Address not loaded. Go back and try again.');
      return;
    }

    const payload = {
      label: l,
      country_iso2: countryCode,
      state_code: hasStates ? stateCode : '',
      municipality: m,
      street: s,
      zip: z,
    };

    setSaving(true);
    if (isEditing && prefillRow) {
      const {error: upErr} = await supabase
        .from('user_addresses')
        .update(payload)
        .eq('id', prefillRow.id)
        .eq('user_id', user.id);
      setSaving(false);
      if (upErr) {
        setError(upErr.message || 'Could not update address.');
        return;
      }
    } else {
      const {error: insErr} = await supabase.from('user_addresses').insert({
        user_id: user.id,
        ...payload,
      });
      setSaving(false);
      if (insErr) {
        setError(insErr.message || 'Could not save address.');
        return;
      }
    }
    navigate(-1);
  }, [
    countryCode,
    editAddressId,
    hasStates,
    isEditing,
    label,
    municipality,
    navigate,
    prefillRow,
    stateCode,
    street,
    zip,
  ]);

  const headerTitle = isEditing ? 'Edit address' : 'Add A New Address';
  const saveButtonText = saving
    ? 'Saving…'
    : isEditing
      ? 'Save changes'
      : 'Save address';

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title={headerTitle}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const municipalityPlaceholder = canUseCitySelect
    ? 'Municipality / city'
    : 'Municipality / city (type)';

  const formLoading =
    geoLoading || !geo || (Boolean(editAddressId) && prefillLoading);

  const showFormError = prefillError && editAddressId;

  return (
    <>
      {renderHeader()}
      <main
        className='scrollable'
        style={{
          padding: 20,
          paddingBottom: 28,
          backgroundColor: 'var(--main-background)',
          minHeight: 'calc(100vh - var(--header-height))',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--input-background)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          {formLoading ? (
            <p
              className='t16'
              style={{color: 'var(--main-color)', textAlign: 'center'}}
            >
              Loading…
            </p>
          ) : showFormError ? (
            <p
              className='t14'
              style={{color: '#f0c4b8', textAlign: 'center'}}
            >
              {prefillError}
            </p>
          ) : (
            <>
              <custom.InputField
                placeholder='Address label (e.g. Home, Work)'
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={60}
                containerStyle={{marginBottom: 10}}
              />
              <custom.SelectField
                placeholder='Country'
                value={countryCode}
                onChange={(e) => onCountryChange(e.target.value)}
                options={countryOptions}
                containerStyle={{marginBottom: 10}}
              />
              {hasStates ? (
                <custom.SelectField
                  placeholder='State / region'
                  value={stateCode}
                  onChange={(e) => onStateChange(e.target.value)}
                  options={stateOptions}
                  containerStyle={{marginBottom: 10}}
                />
              ) : null}
              {(!hasStates || stateCode) &&
                (canUseCitySelect ? (
                  <custom.SelectField
                    placeholder={municipalityPlaceholder}
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    options={cityOptions}
                    containerStyle={{marginBottom: 10}}
                  />
                ) : (
                  <custom.InputField
                    placeholder={municipalityPlaceholder}
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    maxLength={120}
                    containerStyle={{marginBottom: 10}}
                  />
                ))}
              <custom.InputField
                placeholder='Zip / postal code'
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                maxLength={20}
                autoComplete='postal-code'
                containerStyle={{marginBottom: 10}}
              />
              <custom.InputField
                placeholder='Street name and number'
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                maxLength={200}
                autoComplete='street-address'
                containerStyle={{marginBottom: 18}}
              />
              <div
                className='row-center'
                style={{
                  gap: 10,
                  marginBottom: 20,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => setUseCurrentLocation(!useCurrentLocation)}
                role='presentation'
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    backgroundColor: useCurrentLocation
                      ? 'var(--accent-color)'
                      : 'transparent',
                    border: `1px solid ${APP_PALETTE.border}`,
                    borderRadius: 4,
                  }}
                  className='center'
                >
                  {useCurrentLocation ? <svg.RememberCheckSvg /> : null}
                </div>
                <span
                  className='t14'
                  style={{color: 'var(--main-color)'}}
                >
                  Use current location
                </span>
              </div>
              {error ? (
                <p
                  className='t14'
                  style={{
                    color: '#f0c4b8',
                    marginBottom: 12,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </p>
              ) : null}
              <components.Button
                text={saveButtonText}
                onClick={() => void onSave()}
                containerStyle={{
                  opacity: saving ? 0.85 : 1,
                  pointerEvents: saving ? 'none' : 'auto',
                }}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
};
