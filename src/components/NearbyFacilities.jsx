import { useState } from 'react';
import { useLanguage } from '../lib/useLanguage.js';

const facilities = [
  { name: 'Hospitals', description: 'Emergency and hospital care', query: 'hospital', icon: '✚' },
  { name: 'Clinics', description: 'Nearby clinics and doctors', query: 'clinic', icon: '＋' },
  { name: 'Government health centres', description: 'Public and primary health centres', query: 'government primary health centre', icon: '⌂' },
];

function getMapsUrl(query) {
  const params = new URLSearchParams({ api: '1', query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export default function NearbyFacilities() {
  const { t } = useLanguage();
  const [place, setPlace] = useState('');
  const [searchPlace, setSearchPlace] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  function findCurrentLocation() {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError(t('Location is not supported by this browser. Enter your area below instead.'));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSearchPlace(`${coords.latitude},${coords.longitude}`);
        setIsLocating(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? t('Location permission was denied. Allow location access or enter your area below.')
          : error.code === error.POSITION_UNAVAILABLE
            ? t('Your location is unavailable. Enter your area below instead.')
            : t('Could not get your location. Try again or enter your area below.');
        setLocationError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  function searchByArea(event) {
    event.preventDefault();
    const trimmedPlace = place.trim();
    setLocationError('');
    if (!trimmedPlace) {
      setLocationError(t('Enter a city, area, or PIN code to search.'));
      return;
    }
    setSearchPlace(trimmedPlace);
  }

  return (
    <section aria-labelledby="nearby-facilities-title" className="nearby-facilities">
      <div className="nearby-facilities-intro">
        <span aria-hidden="true" className="nearby-facilities-icon">⌖</span>
        <div>
          <h2 id="nearby-facilities-title">{t('Find nearby care')}</h2>
          <p>{t('Search Google Maps for hospitals, clinics, and public health centres near you.')}</p>
        </div>
      </div>

      <div className="nearby-location-actions">
        <button
          className="button button-primary"
          disabled={isLocating}
          onClick={findCurrentLocation}
          type="button"
        >
          {isLocating ? t('Finding your location…') : t('Use my current location')}
        </button>
        <span>{t('Your location is only used when you choose to open Google Maps.')}</span>
      </div>

      <form className="nearby-area-form" onSubmit={searchByArea}>
        <label className="field-label" htmlFor="nearby-area">
          {t('Search by city, area, or PIN code')}
          <input
            autoComplete="postal-code"
            id="nearby-area"
            onChange={(event) => setPlace(event.target.value)}
            placeholder={t('e.g. Bhubaneswar or 751001')}
            value={place}
          />
        </label>
        <button className="button button-outline" type="submit">{t('Search area')}</button>
      </form>

      {locationError && <p className="nearby-location-error" role="alert">{locationError}</p>}

      {searchPlace && (
        <>
          <p className="nearby-results-label">{t('Google Maps searches near')}: <b>{searchPlace.includes(',') && /^-?\d/.test(searchPlace) ? t('your current location') : searchPlace}</b></p>
          <div className="nearby-facility-grid">
            {facilities.map((facility) => (
              <a
                className="nearby-facility-card"
                href={getMapsUrl(`${facility.query} near ${searchPlace}`)}
                key={facility.query}
                rel="noreferrer"
                target="_blank"
              >
                <span aria-hidden="true" className="nearby-facility-card-icon">{facility.icon}</span>
                <span className="nearby-facility-card-copy">
                  <b>{t(facility.name)}</b>
                  <small>{t(facility.description)}</small>
                </span>
                <span aria-hidden="true" className="nearby-facility-arrow">↗</span>
              </a>
            ))}
          </div>
          <p className="nearby-map-note">{t('Google Maps provides live place results. Confirm opening hours and services with the facility before travelling.')}</p>
        </>
      )}
    </section>
  );
}
