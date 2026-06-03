import { useState, useRef } from 'react';
import { useLots } from '../context/LotsContext';
import { calcFineMetal, formatWeight, formatPurity } from '../utils/calculations';
import SuccessToast from './ui/SuccessToast';
import { upload } from '@vercel/blob/client';

export default function Processing() {
  const { qcApprovedLots, suppliers, fetchLots } = useLots();
  const [selectedLotId, setSelectedLotId] = useState('');
  const [postMeltWeight, setPostMeltWeight] = useState('');
  const [actualPurity, setActualPurity] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const fileInputRef = useRef(null);

  const selectedLot = qcApprovedLots.find((l) => String(l.id) === String(selectedLotId));

  const getSupplierName = (id) => {
    const s = suppliers.find((s) => s.id === id);
    return s ? s.name : 'Unknown';
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setPhotos((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreview((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreview((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearForm = () => {
    setSelectedLotId('');
    setPostMeltWeight('');
    setActualPurity('');
    setPhotos([]);
    setPhotoPreview((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLotId || !postMeltWeight || !actualPurity) return;

    setSubmitting(true);
    try {
      let uploadedPhotoUrls = [];
      if (photos.length > 0) {
        const uploadPromises = photos.map(photo => 
          upload(photo.name, photo, {
            access: 'public',
            handleUploadUrl: '/api/upload',
          })
        );
        const blobs = await Promise.all(uploadPromises);
        uploadedPhotoUrls = blobs.map(b => b.url);
      }

      const res = await fetch(`/api/lots/${selectedLotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_melt_weight: parseFloat(postMeltWeight),
          actual_purity: parseFloat(actualPurity),
          status: 'Processed/Melted',
          ...(uploadedPhotoUrls.length > 0 && { photos: uploadedPhotoUrls })
        }),
      });

      if (!res.ok) throw new Error('Failed to update lot');
      const updatedLot = await res.json();

      setToast({ show: true, message: `Lot ${updatedLot.lot_id} melt results recorded!` });
      clearForm();
      fetchLots();
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to record melt results. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <SuccessToast
        message={toast.message}
        show={toast.show}
        onClose={() => setToast({ show: false, message: '' })}
      />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Processing</h1>
          <p className="text-text-secondary mt-1">Record melt and assay results</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Lot Selector */}
          <div>
            <label className="block text-lg font-semibold text-text-primary mb-2">
              Select Lot
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="w-full min-h-[64px] text-xl bg-bg-surface border border-border rounded-xl px-4 py-3 text-text-primary focus:border-border-focus focus:ring-1 focus:ring-border-focus appearance-none cursor-pointer"
              required
            >
              <option value="">Select QC-Approved Lot…</option>
              {qcApprovedLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.lot_id} — {getSupplierName(lot.supplier_id)} — Wt.{formatWeight(lot.initial_weight)}g
                </option>
              ))}
            </select>
            {qcApprovedLots.length === 0 && (
              <p className="text-text-muted text-sm mt-2">No lots awaiting processing.</p>
            )}
          </div>

          {/* Selected Lot Details */}
          {selectedLot && (
            <div className="bg-bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h3 className="text-lg font-semibold text-accent-gold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                Lot Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-text-muted">Lot ID</span>
                  <p className="font-mono font-semibold text-text-primary">{selectedLot.lot_id}</p>
                </div>
                <div>
                  <span className="text-text-muted">Supplier</span>
                  <p className="font-semibold text-text-primary">{getSupplierName(selectedLot.supplier_id)}</p>
                </div>
                <div>
                  <span className="text-text-muted">Initial Weight</span>
                  <p className="font-mono font-semibold text-text-primary">{formatWeight(selectedLot.initial_weight)}g</p>
                </div>
                <div>
                  <span className="text-text-muted">Expected Purity</span>
                  <p className="font-mono font-semibold text-text-primary">{formatPurity(selectedLot.expected_purity)}</p>
                </div>
                <div>
                  <span className="text-text-muted">Item Type</span>
                  <p className="font-semibold text-text-primary">{selectedLot.item_type}</p>
                </div>
                <div>
                  <span className="text-text-muted">Material Type</span>
                  <p className="font-semibold text-text-primary">{selectedLot.material_type}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-text-muted">Est. Fine Metal</span>
                  <p className="font-mono font-semibold text-accent-gold text-lg">
                    {formatWeight(calcFineMetal(selectedLot))}g
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Post Melt Weight */}
          <div>
            <label className="block text-lg font-semibold text-text-primary mb-2">
              Post Melt Weight (g)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={postMeltWeight}
              onChange={(e) => setPostMeltWeight(e.target.value)}
              placeholder="0.00"
              className="w-full min-h-[56px] text-2xl font-mono bg-bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus"
              required
            />
          </div>

          {/* Actual Purity */}
          <div>
            <label className="block text-lg font-semibold text-text-primary mb-2">
              Actual Purity (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={actualPurity}
                onChange={(e) => setActualPurity(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[56px] text-2xl font-mono bg-bg-surface border border-border rounded-xl px-4 py-3 pr-12 text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-1 focus:ring-border-focus"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-text-muted font-mono">%</span>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-lg font-semibold text-text-primary mb-2">
              Photos
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[56px] bg-bg-surface border-2 border-dashed border-border rounded-xl px-4 py-3 text-text-secondary hover:border-accent-gold hover:text-accent-gold transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
              <span className="text-lg font-medium">Take or Upload Photo</span>
            </button>
            {photoPreview.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {photoPreview.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-danger rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !selectedLotId || !postMeltWeight || !actualPurity}
            className="w-full min-h-[80px] bg-accent-gold hover:bg-accent-gold-light text-bg-primary text-xl font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-accent-gold/20"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Recording…
              </span>
            ) : (
              'Record Melt Results'
            )}
          </button>
        </form>

        <div className="h-24" />
      </div>
    </div>
  );
}
