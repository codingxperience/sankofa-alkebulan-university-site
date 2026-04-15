import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../environments/supabase';

function supabaseFetch(path: string, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${path}${params}`;
  return fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  }).then(res => {
    if (!res.ok) throw new Error(`Supabase request failed: ${res.status}`);
    return res.json();
  });
}

export async function getPosts(limit = 10) {
  // select a few fields; adapt to your schema
  return supabaseFetch(
    'Post',
    `?select=id,title,slug,content,published,createdAt&published=eq.true&order=createdAt.desc&limit=${limit}`,
  );
}

export async function getMedia() {
  return supabaseFetch('Media', `?select=id,url,filename,mimetype`);
}
