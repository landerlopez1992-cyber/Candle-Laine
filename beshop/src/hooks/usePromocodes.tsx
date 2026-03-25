import {useState, useEffect, useCallback} from 'react';
import axios from 'axios';

import {URLS} from '../config';
import {supabase} from '../supabaseClient';
import type {PromocodeType} from '../types';
import type {ShopCouponRow, ShopCouponRedemptionRow} from '../types/shop';
import {shopCouponRowToPromocode} from '../utils/shopCouponToPromocode';

export const usePromocodes = () => {
  const [currentPromocodes, setCurrentPromocodes] = useState<PromocodeType[]>(
    [],
  );
  const [usedPromocodes, setUsedPromocodes] = useState<PromocodeType[]>([]);
  const [promocodesLoading, setPromocodesLoading] = useState(true);

  const load = useCallback(async () => {
    setPromocodesLoading(true);

    if (!supabase) {
      setCurrentPromocodes([]);
      setUsedPromocodes([]);
      setPromocodesLoading(false);
      return;
    }

    const {
      data: {session},
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setCurrentPromocodes([]);
      setUsedPromocodes([]);
      setPromocodesLoading(false);
      return;
    }

    const {data: redRows, error: redErr} = await supabase
      .from('shop_coupon_redemptions')
      .select('coupon_id, used_at')
      .eq('user_id', userId);

    if (redErr) {
      console.error(redErr);
      setCurrentPromocodes([]);
      setUsedPromocodes([]);
      setPromocodesLoading(false);
      return;
    }

    const redemptions = (redRows ?? []) as Pick<
      ShopCouponRedemptionRow,
      'coupon_id' | 'used_at'
    >[];
    const redeemedIds = new Set(redemptions.map((r) => r.coupon_id));

    const {data: allCoupons, error: cErr} = await supabase
      .from('shop_coupons')
      .select('*')
      .order('created_at', {ascending: false});

    if (cErr) {
      console.error(cErr);
    }

    if (!cErr && allCoupons?.length) {
      const rows = allCoupons as ShopCouponRow[];
      const byId = new Map(rows.map((r) => [r.id, r]));

      const validCurrent = rows.filter((row) => {
        if (!row.is_active) {
          return false;
        }
        const now = Date.now();
        if (row.starts_at && new Date(row.starts_at).getTime() > now) {
          return false;
        }
        if (row.ends_at && new Date(row.ends_at).getTime() <= now) {
          return false;
        }
        if (redeemedIds.has(row.id)) {
          return false;
        }
        return true;
      });

      setCurrentPromocodes(
        validCurrent.map((r) => shopCouponRowToPromocode(r)),
      );

      const sortedRed = [...redemptions].sort(
        (a, b) =>
          new Date(b.used_at).getTime() - new Date(a.used_at).getTime(),
      );
      const usedList: PromocodeType[] = [];
      for (const r of sortedRed) {
        const c = byId.get(r.coupon_id);
        if (c) {
          usedList.push(shopCouponRowToPromocode(c, r.used_at));
        }
      }
      setUsedPromocodes(usedList);
      setPromocodesLoading(false);
      return;
    }

    try {
      const response = await axios.get(URLS.GET_PROMOCODES);
      const list = response.data?.promocodes;
      if (Array.isArray(list)) {
        setCurrentPromocodes(list as PromocodeType[]);
      } else {
        setCurrentPromocodes([]);
      }
    } catch {
      setCurrentPromocodes([]);
    } finally {
      setUsedPromocodes([]);
      setPromocodesLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => subscription.unsubscribe();
  }, [load]);

  return {
    promocodesLoading,
    currentPromocodes,
    usedPromocodes,
    reloadPromocodes: load,
  };
};
