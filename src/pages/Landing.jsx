import { useParams } from 'react-router-dom';
import Browse from './Browse';
import WebsiteHome from './WebsiteHome';
import { CATEGORY_SLUGS, CITY_SLUGS, buildCategoryPage, buildCityPage } from '../lib/landing.js';

export function CategoryLanding() {
  const { slug } = useParams();
  const cat = CATEGORY_SLUGS[slug];
  if (!cat) return <WebsiteHome />;
  return <Browse key={slug} preset={{ cat: cat.id, page: buildCategoryPage(cat) }} />;
}

export function CityLanding() {
  const { slug } = useParams();
  const city = CITY_SLUGS[slug];
  if (!city) return <WebsiteHome />;
  return <Browse key={slug} preset={{ city: city.name, page: buildCityPage(city) }} />;
}
