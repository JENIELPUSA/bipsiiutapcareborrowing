import React, { useContext, useEffect } from "react";
import {
  ChevronDown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Box,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LaboratoryContext } from "../../contexts/LaboratoryContext/laboratoryContext";

const BorrowModal = ({
  isOpen,
  onClose,
  searchID,
  onConfirm,
  loading,
  borrowBucket,
  setBorrowBucket,
  selectedLaboratory,
  setSelectedLaboratory,
  // skeleton components passed as props
  SkeletonLine,
  NoDataFound,
  // category icon helper
  getCategoryIcon,
}) => {
  const {
    fetchLaboratoriesDropdown,
    laboratoriesDropdown = [],
    fetchcategorydropdown,
    Categories = [],
  } = useContext(LaboratoryContext) || {};

  const [loadingLabs, setLoadingLabs] = React.useState(true);
  const [loadingCategories, setLoadingCategories] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadLabs = async () => {
        setLoadingLabs(true);
        if (fetchLaboratoriesDropdown) await fetchLaboratoriesDropdown();
        setLoadingLabs(false);
      };
      loadLabs();
    }
  }, [isOpen, fetchLaboratoriesDropdown]);

  useEffect(() => {
    if (selectedLaboratory && typeof fetchcategorydropdown === "function") {
      const loadCategories = async () => {
        setLoadingCategories(true);
        await fetchcategorydropdown({ laboratoryId: selectedLaboratory });
        setLoadingCategories(false);
      };
      loadCategories();
    }
  }, [selectedLaboratory, fetchcategorydropdown]);

  const addToBucket = (category) => {
    if (!selectedLaboratory) return;
    const alreadyAdded = borrowBucket.some(
      (item) => item.categoryId === category.categoryId
    );
    if (alreadyAdded) return;
    setBorrowBucket([
      ...borrowBucket,
      {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
      },
    ]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 md:px-8 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  New Loan Transaction
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Select laboratory and click on items to borrow
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
              {/* Left column */}
              <div className="space-y-5">
                {/* Laboratory dropdown */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Laboratory
                  </label>
                  {loadingLabs ? (
                    <SkeletonLine className="h-10 rounded-lg" />
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedLaboratory}
                        onChange={(e) => {
                          setSelectedLaboratory(e.target.value);
                          setBorrowBucket([]);
                        }}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-8 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-500"
                      >
                        <option value="">Select laboratory</option>
                        {laboratoriesDropdown.map((lab) => (
                          <option key={lab._id} value={lab._id}>
                            {lab.laboratoryName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                      />
                    </div>
                  )}
                </div>

                {/* Equipment categories */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Equipment Categories
                  </label>
                  {!selectedLaboratory ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Please select a laboratory first
                      </p>
                    </div>
                  ) : loadingCategories ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[...Array(3)].map((_, i) => (
                        <SkeletonLine key={i} className="h-24 rounded-lg" />
                      ))}
                    </div>
                  ) : Array.isArray(Categories) && Categories.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {Categories.map((cat) => {
                        const IconComponent = getCategoryIcon(cat.categoryName);
                        const isAdded = borrowBucket.some(
                          (item) => item.categoryId === cat.categoryId
                        );
                        return (
                          <button
                            key={cat.categoryId}
                            onClick={() => !isAdded && addToBucket(cat)}
                            disabled={isAdded}
                            className={`relative flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                              isAdded
                                ? "cursor-not-allowed border-emerald-200 bg-emerald-50 opacity-60 dark:border-emerald-800 dark:bg-emerald-900/30"
                                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                            }`}
                          >
                            <IconComponent
                              size={32}
                              className={isAdded ? "text-emerald-500 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {cat.categoryName}
                            </span>
                            {isAdded && (
                              <div className="absolute -right-1 -top-1 rounded-full bg-emerald-500 p-0.5 dark:bg-emerald-600">
                                <CheckCircle2 size={12} className="text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <NoDataFound
                      message="No categories found for this laboratory"
                      icon={AlertCircle}
                    />
                  )}
                </div>
              </div>

              {/* Right column – borrow bucket */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Selected items ({borrowBucket.length})
                </h4>
                {borrowBucket.length === 0 ? (
                  <NoDataFound message="No items added" icon={Box} />
                ) : (
                  <ul className="space-y-2">
                    {borrowBucket.map((item) => (
                      <li
                        key={item.categoryId}
                        className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800 dark:shadow-slate-900"
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {item.categoryName}
                        </span>
                        <button
                          onClick={() =>
                            setBorrowBucket(
                              borrowBucket.filter(
                                (i) => i.categoryId !== item.categoryId
                              )
                            )
                          }
                          className="text-rose-400 transition-colors hover:text-rose-600 dark:text-rose-500 dark:hover:text-rose-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 md:px-8 dark:border-slate-800 dark:bg-slate-900/50">
              <button
                onClick={onClose}
                className="rounded-lg px-5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || borrowBucket.length === 0 || !searchID}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2 text-sm font-bold text-blue-900 shadow-sm transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-50 dark:bg-amber-500 dark:text-blue-900 dark:hover:bg-amber-400"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Processing..." : "Confirm Loan"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BorrowModal;