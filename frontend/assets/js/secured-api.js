import { setupAuth, onAuthStateChanged, signOut } from './auth-client.js';
import { renderBusinessSwitcher } from './business-switcher.js';
import { cachedGet, invalidateBusinessCache } from './api-cache.js';
export async function connect({ decorateHeader = true } = {}) {
  const auth = await setupAuth();
  const user = await new Promise(resolve => { const off = onAuthStateChanged(auth, value => { off(); resolve(value); }); });
  if (!user) { location.replace('/'); throw new Error('Please sign in'); }
  async function get(path, options = {}, business = null) {
    const headers = {Authorization:`Bearer ${await user.getIdToken()}`};
    if (business) headers['X-Business-ID'] = business;
    if (options.body) headers['Content-Type'] = 'application/json';
    const execute = async () => {
      const response = await fetch('/api/v1'+path,{...options,headers});
      const data = response.status === 204 ? null : (response.headers.get('content-type') || '').includes('application/json') ? await response.json() : null;
      if (!response.ok) throw new Error(data?.error || `Server error (${response.status})`);
      return data;
    };
    if ((options.method || 'GET').toUpperCase() === 'GET' && business) {
      return cachedGet({path, userId:user.uid, businessId:business, fetchData:execute});
    }
    const data = await execute();
    if (business) invalidateBusinessCache(user.uid, business);
    return data;
  }
  const me = await get('/me');
  if (!me.businesses.length) { location.replace('/onboarding.html'); throw new Error('Create a business first'); }
  const selected = me.businesses.find(b => String(b.id) === sessionStorage.getItem('urus-business-id')) || me.businesses[0];
  if (decorateHeader) {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => { await signOut(auth); sessionStorage.removeItem('urus-business-id'); location.replace('/'); });
    const heading = document.getElementById('business-name'); if (heading) heading.textContent = selected.name;
    renderBusinessSwitcher(heading, me.businesses, selected.id, () => location.reload());
  }
  return {business:selected, request:(path,options) => get(path, options, selected.id)};
}
