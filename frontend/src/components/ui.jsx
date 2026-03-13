// Các class dùng chung, thay thế cho @apply
export const cls = {
  btn:        "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer",
  btnPrimary: "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
  btnDanger:  "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer bg-red-500 text-white hover:bg-red-600",
  btnGhost:   "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200",
  card:       "bg-white rounded-xl shadow-sm border border-gray-100 p-6",
  input:      "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm",
  label:      "block text-sm font-medium text-gray-700 mb-1",
  badgeMale:  "text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700",
  badgeFemale:"text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700",
}