import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiTrash2, FiMapPin } from "react-icons/fi";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import toast from "react-hot-toast";
import { createRoom, deleteRoom } from "../../../core/api/timetableService";
import { getErrorMessage } from "../../../core/utils/errorHandler";

export default function RoomsModal({ isOpen, onClose, rooms = [], onChanged }) {
  const { i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setCapacity("");
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error(isFr ? "Nom de salle requis" : "Room name is required");
      return;
    }
    setSaving(true);
    try {
      await createRoom({ name: name.trim(), capacity: Number(capacity) || 0 });
      toast.success(isFr ? "Salle ajoutée" : "Room added");
      setName("");
      setCapacity("");
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, isFr ? "Impossible d'ajouter la salle" : "Could not add room"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isFr ? "Supprimer cette salle ? Les cours associés garderont leur créneau." : "Delete this room? Related lessons keep their slot.")) return;
    try {
      await deleteRoom(id);
      toast.success(isFr ? "Salle supprimée" : "Room deleted");
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, isFr ? "Impossible de supprimer la salle" : "Could not delete room"));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFr ? "Salles" : "Rooms"}
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose} size="sm">
          {isFr ? "Fermer" : "Close"}
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Ajout rapide */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1">
              {isFr ? "Nom de la salle" : "Room name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={isFr ? "Ex : Salle 12, Labo Physique…" : "e.g. Room 12, Physics Lab…"}
              className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 transition-all"
            />
          </div>
          <div className="w-24">
            <label className="block text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1">
              {isFr ? "Capacité" : "Capacity"}
            </label>
            <input
              type="number"
              min="0"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/15 transition-all"
            />
          </div>
          <Button onClick={handleAdd} size="sm" loading={saving}>
            <FiPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* Liste */}
        <div className="divide-y divide-surface-100 dark:divide-surface-700/70 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
          {rooms.length === 0 && (
            <p className="text-sm text-surface-400 text-center py-6">
              {isFr ? "Aucune salle définie pour le moment" : "No rooms defined yet"}
            </p>
          )}
          {rooms.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-900/40 transition-colors">
              <span className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                <FiMapPin className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-surface-800 dark:text-surface-100 truncate">{r.name}</div>
                <div className="text-[11px] text-surface-400">
                  {r.capacity ? `${r.capacity} ${isFr ? "places" : "seats"}` : isFr ? "Salle" : "Room"} · {r.roomType}
                </div>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title={isFr ? "Supprimer" : "Delete"}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
