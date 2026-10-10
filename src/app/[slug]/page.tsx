import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicBookingScreen } from "@/features/public-booking/public-booking-screen";
import { ApiError } from "@/lib/api/api-error";
import { getPublicBusiness } from "@/lib/api/generated/public/public";
import { isSlugLike } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

/** A API devolve 404 para slug inexistente ou negócio desativado; os dois casos viram a mesma tela. */
async function loadBusiness(slug: string) {
  // Este segmento recebe qualquer caminho da raiz (/robots.txt, varreduras de bots): só consulta
  // a API para o que tem forma de slug, e nunca monta a URL dela com "/" ou ".." vindos do endereço
  if (!isSlugLike(slug)) return null;

  try {
    return await getPublicBusiness(slug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await loadBusiness(slug);

  if (!business) {
    return { title: "Página não encontrada" };
  }

  const title = business.name;
  const description = business.description || `Agende seu horário com ${business.name} pela Agendly.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function PublicBusinessPage({ params }: Props) {
  const { slug } = await params;
  const business = await loadBusiness(slug);

  if (!business) {
    notFound();
  }

  return <PublicBookingScreen slug={slug} business={business} />;
}
