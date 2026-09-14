'use client';

import React, { useState, useEffect } from 'react';
import { GiftPackagingState } from './state/customization-types';

interface CustomizerSummaryProps {
  gift: GiftPackagingState;
  onChangeGift: (gift: GiftPackagingState) => void;
  pincode: string;
  pincodeStatus: 'idle' | 'checking' | 'serviceable' | 'unserviceable';
  onChangePincode: (pin: string) => void;
  onCheckPincode: (pin: string) => void;
  onAddToCart: () => void;
  onWhatsAppOrder: () => void;
}

const PINCODE_REGIONS: Record<string, { city: string; days: number }> = {
  '11': { city: 'Delhi & NCR', days: 2 },
  '12': { city: 'Haryana (Gurugram/Faridabad)', days: 2 },
  '13': { city: 'Haryana / Punjab', days: 3 },
  '14': { city: 'Punjab (Chandigarh)', days: 2 },
  '15': { city: 'Punjab', days: 3 },
  '16': { city: 'Chandigarh', days: 2 },
  '17': { city: 'Himachal Pradesh', days: 3 },
  '18': { city: 'Jammu & Kashmir', days: 4 },
  '19': { city: 'Srinagar & Kashmir', days: 4 },
  '20': { city: 'Western UP (Noida/Ghaziabad)', days: 2 },
  '21': { city: 'UP (Prayagraj/Agra)', days: 3 },
  '22': { city: 'UP (Lucknow/Kanpur)', days: 2 },
  '23': { city: 'UP East (Varanasi)', days: 3 },
  '24': { city: 'UP / Uttarakhand (Dehradun)', days: 3 },
  '25': { city: 'UP (Meerut)', days: 2 },
  '26': { city: 'UP (Bareilly)', days: 3 },
  '27': { city: 'UP (Gorakhpur)', days: 3 },
  '28': { city: 'UP (Jhansi)', days: 3 },
  '30': { city: 'Rajasthan (Jaipur)', days: 2 },
  '31': { city: 'Rajasthan (Udaipur)', days: 3 },
  '32': { city: 'Rajasthan (Kota)', days: 3 },
  '33': { city: 'Rajasthan (Bikaner)', days: 3 },
  '34': { city: 'Rajasthan (Jodhpur)', days: 3 },
  '36': { city: 'Gujarat (Rajkot)', days: 3 },
  '37': { city: 'Gujarat (Kutch)', days: 4 },
  '38': { city: 'Gujarat (Ahmedabad)', days: 2 },
  '39': { city: 'Gujarat (Surat/Vadodara)', days: 2 },
  '40': { city: 'Mumbai & MMR', days: 2 },
  '41': { city: 'Maharashtra (Pune)', days: 2 },
  '42': { city: 'Maharashtra (Nashik)', days: 3 },
  '43': { city: 'Maharashtra (Aurangabad)', days: 3 },
  '44': { city: 'Maharashtra (Nagpur)', days: 3 },
  '45': { city: 'MP (Indore)', days: 2 },
  '46': { city: 'MP (Bhopal)', days: 3 },
  '47': { city: 'MP (Gwalior)', days: 3 },
  '48': { city: 'MP (Jabalpur)', days: 3 },
  '49': { city: 'Chhattisgarh (Raipur)', days: 3 },
  '50': { city: 'Hyderabad & Telangana', days: 2 },
  '51': { city: 'AP (Tirupati)', days: 3 },
  '52': { city: 'AP (Vijayawada)', days: 3 },
  '53': { city: 'AP (Visakhapatnam)', days: 3 },
  '56': { city: 'Bangalore Urban', days: 2 },
  '57': { city: 'Karnataka (Mangalore/Mysore)', days: 3 },
  '58': { city: 'Karnataka (Hubli/Belgaum)', days: 3 },
  '59': { city: 'Karnataka (North)', days: 3 },
  '60': { city: 'Chennai & Suburbs', days: 2 },
  '61': { city: 'Tamil Nadu (Central)', days: 3 },
  '62': { city: 'Tamil Nadu (Madurai)', days: 3 },
  '63': { city: 'Tamil Nadu (Coimbatore/Salem)', days: 3 },
  '64': { city: 'Tamil Nadu (Coimbatore)', days: 3 },
  '67': { city: 'Kerala (Calicut)', days: 3 },
  '68': { city: 'Kerala (Cochin/Ernakulam)', days: 2 },
  '69': { city: 'Kerala (Trivandrum)', days: 3 },
  '70': { city: 'Kolkata Metro', days: 2 },
  '71': { city: 'West Bengal (Howrah/Hooghly)', days: 3 },
  '72': { city: 'West Bengal (Midnapore)', days: 3 },
  '73': { city: 'West Bengal (Siliguri)', days: 3 },
  '74': { city: 'West Bengal (North 24 Parganas)', days: 3 },
  '75': { city: 'Odisha (Bhubaneswar/Cuttack)', days: 3 },
  '78': { city: 'Assam (Guwahati)', days: 3 },
  '79': { city: 'North East India', days: 4 },
  '80': { city: 'Bihar (Patna)', days: 3 },
  '81': { city: 'Bihar (Bhagalpur)', days: 3 },
  '82': { city: 'Bihar (Gaya/Muzaffarpur)', days: 3 },
  '83': { city: 'Jharkhand (Ranchi/Jamshedpur)', days: 3 },
};

export function CustomizerSummary({
  gift,
  onChangeGift,
  pincode,
  pincodeStatus,
  onChangePincode,
  onCheckPincode,
  onAddToCart,
  onWhatsAppOrder,
}: CustomizerSummaryProps) {
  const [dispatchStr, setDispatchStr] = useState('Tomorrow');
  const [deliveryStr, setDeliveryStr] = useState('3–5 Days');
  const [timerStr, setTimerStr] = useState('--');

  const [pincodeHtml, setPincodeHtml] = useState<string | null>(null);

  useEffect(() => {
    function calculateSchedule() {
      const now = new Date();
      const isPastCutoff = now.getHours() >= 17;

      const dispatchDate = new Date(now);
      dispatchDate.setDate(dispatchDate.getDate() + (isPastCutoff ? 2 : 1));
      if (dispatchDate.getDay() === 0) {
        dispatchDate.setDate(dispatchDate.getDate() + 1);
      }

      const delivStart = new Date(dispatchDate);
      delivStart.setDate(delivStart.getDate() + 3);
      const delivEnd = new Date(dispatchDate);
      delivEnd.setDate(delivEnd.getDate() + 5);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const dStr = `${days[dispatchDate.getDay()]}, ${dispatchDate.getDate()} ${months[dispatchDate.getMonth()]}`;

      let delStr = '';
      if (delivStart.getMonth() === delivEnd.getMonth()) {
        delStr = `${delivStart.getDate()}–${delivEnd.getDate()} ${months[delivStart.getMonth()]}`;
      } else {
        delStr = `${delivStart.getDate()} ${months[delivStart.getMonth()]} – ${delivEnd.getDate()} ${months[delivEnd.getMonth()]}`;
      }

      const cutoff = new Date(now);
      if (isPastCutoff) cutoff.setDate(cutoff.getDate() + 1);
      cutoff.setHours(17, 0, 0, 0);
      const diffMs = Math.max(0, cutoff.getTime() - now.getTime());
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setDispatchStr(dStr);
      setDeliveryStr(delStr);
      setTimerStr(`${diffHrs}h ${diffMins}m`);
    }

    calculateSchedule();
    const interval = setInterval(calculateSchedule, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePincodeSubmit = () => {
    const cleaned = pincode.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length < 6) {
      if (cleaned.length > 0) {
        setPincodeHtml('<span class="pincode-error">Enter a full 6-digit Indian pincode</span>');
      } else {
        setPincodeHtml(null);
      }
      onCheckPincode(cleaned);
      return;
    }

    const prefix = cleaned.slice(0, 2);
    const info = PINCODE_REGIONS[prefix] || { city: 'India', days: 3 };

    const d = new Date();
    d.setDate(d.getDate() + 1 + info.days);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;

    setPincodeHtml(`
      <div class="pincode-success">
        <div>🟢 <strong>Free Express Air Delivery to ${info.city} (${cleaned})</strong></div>
        <div class="pincode-meta-row">Expected arrival: <strong>${dateStr}</strong> · Bluedart / Delhivery Air</div>
        <div class="pincode-meta-row" style="color: var(--accent);">✓ COD Available (₹49 advance to reserve, ₹450 on delivery)</div>
        <div class="pincode-meta-row" style="font-size: 0.71rem; color: var(--muted); font-style: italic; margin-top: 4px;">* Delivery availability and ETA will be confirmed after order verification.</div>
      </div>
    `);
    onCheckPincode(cleaned);
  };

  const totalCost = 499 + (gift.isGift ? gift.cost : 0);

  return (
    <>
      <div className="offer-banner">
        <div className="offer-title">
          <span>Standard Price</span>
          <span className="offer-price">₹{totalCost}</span>
        </div>
        <div className="offer-body">
          Personalized A4 Wall Frame · Authentic Persian artwork background with bespoke calligraphy &amp; Free Pan-India Delivery. Cash on Delivery available.
        </div>
      </div>

      {/* FREE GIFT PACKAGING & NOTE CARD ADDON */}
      <div className="gift-addon-card" id="giftAddonCard">
        <label className="gift-addon-toggle" htmlFor="giftToggle">
          <input
            type="checkbox"
            id="giftToggle"
            checked={gift.isGift}
            onChange={(e) =>
              onChangeGift({
                ...gift,
                isGift: e.target.checked,
              })
            }
          />
          <span className="gift-checkbox-custom" />
          <div className="gift-toggle-text">
            <span className="gift-toggle-title">🎁 Send as a Luxury Gift? (+₹69)</span>
            <span className="gift-toggle-desc">Includes satin ribbon wrap, wax seal &amp; personalized greeting note card</span>
          </div>
          <span className="gift-price-badge">+₹69</span>
        </label>

        <div className="gift-fields" id="giftFields" style={{ display: gift.isGift ? 'block' : 'none' }}>
          <div className="gift-fields-grid">
            <input
              className="input gift-input"
              id="giftTo"
              placeholder="To (Recipient Name)"
              maxLength={40}
              value={gift.to}
              onChange={(e) => onChangeGift({ ...gift, to: e.target.value })}
            />
            <input
              className="input gift-input"
              id="giftFrom"
              placeholder="From (Your Name)"
              maxLength={40}
              value={gift.from}
              onChange={(e) => onChangeGift({ ...gift, from: e.target.value })}
            />
          </div>
          <textarea
            className="input gift-input"
            id="giftMessage"
            placeholder="Gift message (e.g. Wishing you a lifetime of happiness, love, and barakah!)..."
            maxLength={180}
            rows={2}
            value={gift.message}
            onChange={(e) => onChangeGift({ ...gift, message: e.target.value })}
          />
          <div className="gift-note-hint">✦ We&apos;ll elegantly print this note and place it inside the luxury gift box.</div>
        </div>
      </div>

      {/* DISPATCH & DELIVERY ESTIMATOR */}
      <div className="dispatch-estimator-card">
        <div className="dispatch-top-row">
          <div className="dispatch-live-tag">
            <span className="pulse-dot-live" />
            <span>MADE TO ORDER</span>
          </div>
          <div className="dispatch-urgency">
            Order in <strong id="dispatchTimer">{timerStr}</strong> for next dispatch
          </div>
        </div>
        <div className="dispatch-timeline">
          <div className="dispatch-step">
            <span className="dispatch-step-label">Handcrafted &amp; Dispatched</span>
            <strong className="dispatch-step-date" id="estDispatchDate">{dispatchStr}</strong>
          </div>
          <div className="dispatch-timeline-connector" />
          <div className="dispatch-step step-right">
            <span className="dispatch-step-label">Free Pan-India Delivery</span>
            <strong className="dispatch-step-date" id="estDeliveryDate">{deliveryStr}</strong>
          </div>
        </div>
        <div className="dispatch-carrier-badge">
          <span className="dispatch-carrier-icon">🚚</span>
          <span>Free Express Air Delivery via Bluedart / Delhivery</span>
        </div>
        <div style={{ fontSize: '0.69rem', color: 'var(--muted)', textAlign: 'center', marginTop: '5px', fontStyle: 'italic' }}>
          * Delivery availability and ETA will be confirmed after order verification.
        </div>

        <div className="pincode-checker">
          <div className="pincode-input-wrap">
            <span className="pincode-icon">📍</span>
            <input
              type="text"
              id="pincodeInput"
              className="pincode-input"
              placeholder="Check Delivery Pincode (e.g. 110001)"
              maxLength={6}
              inputMode="numeric"
              value={pincode}
              onChange={(e) => onChangePincode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePincodeSubmit();
                }
              }}
            />
            <button
              type="button"
              className="pincode-btn"
              onClick={handlePincodeSubmit}
            >
              Check
            </button>
          </div>
          {pincodeHtml && (
            <div
              className="pincode-result active"
              id="pincodeResult"
              dangerouslySetInnerHTML={{ __html: pincodeHtml }}
            />
          )}
        </div>
      </div>

      <button
        type="button"
        className="btn"
        id="addToCartBtn"
        onClick={onAddToCart}
        style={{ width: '100%', padding: '16px', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.04em' }}
      >
        Add to Cart 🛒
      </button>

      <button
        type="button"
        className="btn btn-whatsapp"
        id="orderWhatsAppBtn"
        onClick={onWhatsAppOrder}
        style={{ width: '100%', padding: '14px', marginTop: '8px' }}
      >
        <svg className="btn-wa-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Order via WhatsApp (1-Click)
      </button>

      <div className="risk-free-badge">
        <div className="shield-icon">🛡️</div>
        <div>
          <strong>100% Risk-Free Transit Guarantee</strong>
          <span>Damaged or incorrect? We ship a free remake immediately. You only pay the balance ₹450 upon safe delivery.</span>
        </div>
      </div>
    </>
  );
}
