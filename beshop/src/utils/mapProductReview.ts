import type {ReviewType} from '../types';

type ProfileMini = {full_name: string | null; email: string | null} | null;

export type ProductReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: ProfileMini | ProfileMini[];
};

function normalizeProfile(
  p: ProductReviewRow['profiles'],
): ProfileMini {
  if (Array.isArray(p)) {
    return p[0] ?? null;
  }
  return p ?? null;
}

export function reviewAvatarUrl(displayName: string): string {
  const n = displayName.trim() || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&size=64&background=926D50&color=fff`;
}

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function mapProductReviewRow(row: ProductReviewRow): ReviewType {
  const prof = normalizeProfile(row.profiles);
  const name =
    prof?.full_name?.trim() ||
    prof?.email?.trim() ||
    'Customer';

  return {
    id: row.id,
    name,
    rating: row.rating,
    comment: row.comment ?? '',
    date: formatReviewDate(row.created_at),
    photo: reviewAvatarUrl(name),
  };
}

export function mapProductReviewRows(rows: ProductReviewRow[]): ReviewType[] {
  return rows.map(mapProductReviewRow);
}
