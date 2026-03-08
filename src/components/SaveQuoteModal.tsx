import { useState } from 'react';
import { X } from 'lucide-react';
import { CalculationResult } from '../types/calculator';
import { saveQuote, validateQuoteInput } from '../services/quoteService';

interface SaveQuoteModalProps {
  result: CalculationResult;
  sheetType: string;
  sheetThickness: string;
  sheetColor: string;
  onClose: () => void;
  onSave: () => void;
}

export default function SaveQuoteModal({
  result,
  sheetType,
  sheetThickness,
  sheetColor,
  onClose,
  onSave
}: SaveQuoteModalProps) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      validateQuoteInput({
        result,
        sheetType,
        sheetThickness,
        sheetColor,
        clientName,
        clientEmail,
        notes
      });
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Error de validación.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await saveQuote({
        result,
        sheetType,
        sheetThickness,
        sheetColor,
        clientName,
        clientEmail,
        notes
      });

      onSave();
    } catch (err) {
      console.error('Error saving quote:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la cotización. Por favor intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-black text-[#00011a] uppercase">Guardar Cotización</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Notas Adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
              placeholder="Observaciones o requisitos especiales..."
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Dimensiones:</span>
              <span className="font-bold text-[#00011a]">{result.width}m x {result.height}m</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Láminas:</span>
              <span className="font-bold text-[#00011a]">{result.numSheets} unidades</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-700">Total:</span>
              <span className="font-black text-cyan-600">
                ₡{result.total.toLocaleString('es-CR')}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold text-sm uppercase hover:bg-gray-100 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-sm uppercase transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
