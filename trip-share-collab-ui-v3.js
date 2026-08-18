(() => {
  const getTripParam = () => new URLSearchParams(location.search).get('t');
  const isSharedTrip = () => !!getTripParam();

  async function loadSharedTrip() {
    const id = getTripParam();
    if (!id) return;
    try {
      const res = await fetch(`/api/trip/${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`trip ${res.status}`);
      const payload = await res.json();
      const trip = payload.trip || payload.data || payload;
      if (!trip || typeof trip !== 'object') throw new Error('invalid trip');

      // Shared-link mode must be isolated: replace the local trip list rather than
      // importing the shared trip alongside existing local trips.
      const storageKeys = ['lvban_trips', 'travelmate_trips', 'trips'];
      const serialized = JSON.stringify([trip]);
      storageKeys.forEach((key) => {
        try { localStorage.setItem(key, serialized); } catch (_) {}
      });
      try { localStorage.setItem('lvban_shared_trip_id', id); } catch (_) {}

      window.__LVBAN_SHARED_TRIP__ = trip;
      window.__LVBAN_SHARED_TRIP_ID__ = id;

      // Keep the original short link as the canonical URL. Never navigate to a
      // generated local/detail URL and never silently strip ?t=...
      history.replaceState(null, '', `${location.pathname}?t=${encodeURIComponent(id)}`);

      // Notify the existing app and let its normal navigation open the sole trip.
      window.dispatchEvent(new CustomEvent('lvban-shared-trip-ready', { detail: { trip, id } }));
      window.dispatchEvent(new CustomEvent('lvban-data-ready'));

      setTimeout(() => {
        const tripName = trip.tripName || trip.name || '';
        const cards = [...document.querySelectorAll('[data-trip-id], .trip-card, .trip-item, .itinerary-card')];
        const target = cards.find(el => (el.textContent || '').includes(tripName));
        if (target) target.click();
        else if (typeof window.openTrip === 'function') window.openTrip(trip);
        else if (typeof window.showTripDetail === 'function') window.showTripDetail(trip);
      }, 250);
    } catch (err) {
      console.error('[lvban] shared trip load failed', err);
    }
  }

  function hideOtherTripsInSharedMode() {
    if (!isSharedTrip()) return;
    const id = getTripParam();
    const shared = window.__LVBAN_SHARED_TRIP__;
    if (!shared) return;
    // Defensive UI filtering: if the existing app renders a trip list from local
    // data before the KV result arrives, keep only the shared trip once it is known.
    document.querySelectorAll('[data-trip-id]').forEach(el => {
      const eid = el.getAttribute('data-trip-id');
      if (eid && eid !== id) el.style.display = 'none';
    });
  }

  window.addEventListener('lvban-shared-trip-ready', hideOtherTripsInSharedMode);
  window.addEventListener('lvban-data-ready', () => setTimeout(hideOtherTripsInSharedMode, 50));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSharedTrip, { once: true });
  else loadSharedTrip();
})();
