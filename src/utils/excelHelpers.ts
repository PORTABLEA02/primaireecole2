import * as XLSX from 'xlsx';

export class ExcelHelpers {
  // Lire un fichier Excel et retourner les données
  static async readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Prendre la première feuille
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convertir en JSON avec en-têtes
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '' // Valeur par défaut pour les cellules vides
          });
          
          if (jsonData.length < 2) {
            reject(new Error('Le fichier doit contenir au moins une ligne d\'en-têtes et une ligne de données'));
            return;
          }
          
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Erreur lors de la lecture du fichier Excel'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Créer un fichier Excel à partir de données
  static createExcelFile(data: any[], fileName: string, sheetName: string = 'Données') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Ajuster la largeur des colonnes
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15) // Largeur minimum de 15 caractères
    }));
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  }

  // Créer un modèle Excel avec en-têtes et exemples
  static createTemplate(
    headers: string[], 
    sampleData: any[], 
    fileName: string,
    instructions?: string[]
  ) {
    const wb = XLSX.utils.book_new();
    
    // Feuille principale avec les données
    const mainData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(mainData);
    
    // Styliser les en-têtes
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E3F2FD' } },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
    }
    
    // Ajuster la largeur des colonnes
    const colWidths = headers.map(header => ({
      wch: Math.max(header.length + 5, 15)
    }));
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Données');
    
    // Feuille d'instructions si fournie
    if (instructions && instructions.length > 0) {
      const instructionData = [
        ['Instructions d\'Import'],
        [''],
        ...instructions.map(instruction => [instruction])
      ];
      const instructionWs = XLSX.utils.aoa_to_sheet(instructionData);
      XLSX.utils.book_append_sheet(wb, instructionWs, 'Instructions');
    }
    
    XLSX.writeFile(wb, fileName);
  }

  // Valider la structure d'un fichier Excel
  static validateExcelStructure(
    data: any[], 
    requiredHeaders: string[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.length < 2) {
      errors.push('Le fichier doit contenir au moins une ligne d\'en-têtes et une ligne de données');
      return { isValid: false, errors };
    }
    
    const headers = data[0] as string[];
    
    // Vérifier les en-têtes requis
    for (const requiredHeader of requiredHeaders) {
      if (!headers.includes(requiredHeader)) {
        errors.push(`Colonne manquante: "${requiredHeader}"`);
      }
    }
    
    // Vérifier qu'il y a des données
    const dataRows = data.slice(1).filter(row => 
      Array.isArray(row) && row.some(cell => cell && cell.toString().trim() !== '')
    );
    
    if (dataRows.length === 0) {
      errors.push('Aucune ligne de données trouvée');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Nettoyer les données Excel
  static cleanExcelData(data: any[]): any[] {
    return data.map(row => {
      if (!Array.isArray(row)) return row;
      
      return row.map(cell => {
        if (cell === null || cell === undefined) return '';
        
        // Nettoyer les chaînes
        if (typeof cell === 'string') {
          return cell.trim();
        }
        
        // Convertir les nombres Excel en dates si nécessaire
        if (typeof cell === 'number' && cell > 25569 && cell < 50000) {
          // Potentiellement une date Excel
          const date = new Date((cell - 25569) * 86400 * 1000);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
        
        return cell;
      });
    });
  }

  // Détecter le type de données dans une colonne
  static detectColumnType(columnData: any[]): 'text' | 'number' | 'date' | 'email' | 'phone' {
    const nonEmptyData = columnData.filter(cell => cell && cell.toString().trim() !== '');
    
    if (nonEmptyData.length === 0) return 'text';
    
    // Détecter les emails
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (nonEmptyData.every(cell => emailPattern.test(cell.toString()))) {
      return 'email';
    }
    
    // Détecter les téléphones
    const phonePattern = /^\+?[\d\s\-\(\)]{8,}$/;
    if (nonEmptyData.every(cell => phonePattern.test(cell.toString()))) {
      return 'phone';
    }
    
    // Détecter les nombres
    if (nonEmptyData.every(cell => !isNaN(parseFloat(cell.toString())))) {
      return 'number';
    }
    
    // Détecter les dates
    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{4}-\d{1,2}-\d{1,2}$/;
    if (nonEmptyData.some(cell => datePattern.test(cell.toString()))) {
      return 'date';
    }
    
    return 'text';
  }

  // Convertir les données Excel en format standardisé
  static standardizeExcelData(rawData: any[], mapping: Record<string, string>): any[] {
    if (rawData.length < 2) return [];
    
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1);
    
    return dataRows.map((row, index) => {
      const standardizedRow: any = {};
      
      headers.forEach((header, headerIndex) => {
        const standardKey = mapping[header] || header;
        let value = row[headerIndex];
        
        // Nettoyer et standardiser la valeur
        if (value !== null && value !== undefined) {
          value = value.toString().trim();
          
          // Conversions spécifiques
          if (standardKey.toLowerCase().includes('date') && value) {
            value = this.parseExcelDate(value);
          } else if (standardKey.toLowerCase().includes('email') && value) {
            value = value.toLowerCase();
          } else if (standardKey.toLowerCase().includes('phone') && value) {
            value = this.formatPhoneNumber(value);
          }
        }
        
        standardizedRow[standardKey] = value || '';
      });
      
      standardizedRow._originalRow = index + 2; // +2 car ligne 1 = en-têtes
      return standardizedRow;
    }).filter(row => {
      // Filtrer les lignes complètement vides
      return Object.values(row).some(value => 
        value && value.toString().trim() !== '' && value !== '_originalRow'
      );
    });
  }

  // Parser une date Excel
  private static parseExcelDate(value: any): string | null {
    if (!value) return null;
    
    // Si c'est déjà une date ISO
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    
    // Si c'est un nombre Excel (jours depuis 1900)
    if (typeof value === 'number' && value > 25569 && value < 50000) {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Essayer de parser comme chaîne de date
    try {
      const date = new Date(value.toString());
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      // Ignore
    }
    
    return null;
  }

  // Formater un numéro de téléphone
  private static formatPhoneNumber(value: string): string {
    // Nettoyer le numéro
    const cleaned = value.replace(/\D/g, '');
    
    // Format béninois
    if (cleaned.length === 8 && cleaned.startsWith('0')) {
      return `+229 ${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('229')) {
      return `+${cleaned}`;
    }
    
    return value; // Retourner tel quel si format non reconnu
  }

  // Exporter des données vers Excel avec formatage
  static exportToExcel(
    data: any[], 
    fileName: string, 
    options: {
      sheetName?: string;
      includeFilters?: boolean;
      freezeFirstRow?: boolean;
      columnWidths?: number[];
    } = {}
  ) {
    const {
      sheetName = 'Export',
      includeFilters = true,
      freezeFirstRow = true,
      columnWidths
    } = options;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Appliquer les largeurs de colonnes
    if (columnWidths) {
      ws['!cols'] = columnWidths.map(width => ({ wch: width }));
    } else {
      // Largeurs automatiques basées sur le contenu
      const headers = Object.keys(data[0] || {});
      ws['!cols'] = headers.map(header => ({
        wch: Math.max(header.length + 2, 12)
      }));
    }
    
    // Figer la première ligne
    if (freezeFirstRow) {
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    }
    
    // Ajouter des filtres
    if (includeFilters && data.length > 0) {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
    }
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  }
}