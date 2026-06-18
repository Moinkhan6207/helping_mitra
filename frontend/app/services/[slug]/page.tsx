import { Metadata } from 'next';
import ServiceDetailClient from './ServiceDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050/api';
    const response = await fetch(`${apiBaseUrl}/services/${slug}`, {
      next: { revalidate: 60 }, // Cache on Next.js server for 60 seconds
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.data) {
        return {
          title: `${data.data.name} | Helping Mitra`,
          description: data.data.shortDescription || 'Digital services detail on Helping Mitra.',
        };
      }
    }
  } catch (error) {
    // Fallback on request errors (e.g. server offline during static build checks)
  }

  return {
    title: 'Service Details | Helping Mitra',
    description: 'Browse digital services details on Helping Mitra.',
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <ServiceDetailClient slug={slug} />;
}
