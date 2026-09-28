/** Até duas iniciais em maiúsculo ("Zé Carlos" → "ZC"). */
export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** Máscara de telefone brasileiro: (11) 91234-5678 ou (11) 3456-7890. */
export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits.length) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Converte um texto em slug no formato aceito pela API (^[a-z0-9]+(-[a-z0-9]+)*$).
 * Com `typing`, preserva o hífen final para não "comer" o que a pessoa está digitando.
 */
export function slugify(value: string, typing = false) {
  let slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/, "");

  if (!typing) slug = slug.replace(/-$/, "");
  return slug.slice(0, 50);
}

export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
