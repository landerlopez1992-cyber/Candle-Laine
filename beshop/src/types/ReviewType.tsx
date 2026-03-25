export type ReviewType = {
  /** UUID en Supabase o identificador estable en cliente */
  id: string;
  name: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  email?: string;
  photo?: string;
  date?: string;
};
