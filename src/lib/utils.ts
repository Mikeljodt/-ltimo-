import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusConfig(status: string) {
  const statusConfigs: Record<string, { label: string; className: string }> = {
    warehouse: {
      label: 'En Almacén',
      className: 'px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium'
    },
    installed: {
      label: 'Instalada',
      className: 'px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium'
    },
    repair: {
      label: 'En Reparación',
      className: 'px-2 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium'
    },
    retired: {
      label: 'Retirada',
      className: 'px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium'
    }
  };

  return statusConfigs[status] || {
    label: 'Desconocido',
    className: 'px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium'
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
}

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function calculateDaysBetween(startDate: string | Date, endDate: string | Date = new Date()): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Convert to UTC to avoid timezone issues
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  // Calculate difference in days
  return Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24));
}

/**
 * Descarga un archivo con el contenido proporcionado
 * @param content Contenido del archivo a descargar
 * @param fileName Nombre del archivo
 * @param contentType Tipo de contenido (MIME type)
 */
export function downloadFile(content: string, fileName: string, contentType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  
  // Limpieza
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
