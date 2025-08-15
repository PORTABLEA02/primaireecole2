import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Calendar, DollarSign, User, FileText, Building, Phone, Mail } from 'lucide-react';
import { PaymentService } from '../../services/paymentService';
import { useAuth } from '../Auth/AuthProvider';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface StudentInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

interface PaymentTransaction {
  id: string;
  amount: number;
  payment_type: string;
  payment_date: string;
  reference_number?: string;
  payment_method?: {
    name: string;
    type: string;
  };
  notes?: string;
}

const StudentInvoiceModal: React.FC<StudentInvoiceModalProps> = ({
  isOpen,
  onClose,
  student
}) => {
  const { userSchool } = useAuth();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      loadPaymentHistory();
    }
  }, [isOpen, student]);

  const loadPaymentHistory = async () => {
    if (!student) return;

    try {
      setLoading(true);
      const paymentHistory = await PaymentService.getPaymentHistory(student.id);
      setPayments(paymentHistory);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique des paiements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalFees = student?.total_fees || 0;
    const remainingAmount = totalFees - totalPaid;

    return {
      totalPaid,
      totalFees,
      remainingAmount
    };
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const { totalPaid, totalFees, remainingAmount } = calculateTotals();

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Facture - ${student?.first_name} ${student?.last_name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .school-info {
            font-size: 14px;
            color: #666;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            color: #1f2937;
          }
          .student-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .info-label {
            font-weight: bold;
            color: #4b5563;
          }
          .payments-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .payments-table th,
          .payments-table td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: left;
          }
          .payments-table th {
            background: #f3f4f6;
            font-weight: bold;
            color: #374151;
          }
          .payments-table tr:nth-child(even) {
            background: #f9fafb;
          }
          .amount {
            font-weight: bold;
            color: #059669;
          }
          .summary {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
          }
          .summary-title {
            font-size: 18px;
            font-weight: bold;
            color: #0c4a6e;
            margin-bottom: 15px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
          }
          .summary-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 6px;
          }
          .summary-amount {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .summary-label {
            font-size: 14px;
            color: #6b7280;
          }
          .total-paid {
            color: #059669;
          }
          .total-fees {
            color: #2563eb;
          }
          .remaining {
            color: #dc2626;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #d1d5db;
            padding-top: 20px;
          }
          .no-payments {
            text-align: center;
            padding: 40px;
            color: #6b7280;
            font-style: italic;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">${userSchool?.name || 'École'}</div>
          <div class="school-info">
            ${userSchool?.address || ''}<br>
            Tél: ${userSchool?.phone || ''} • Email: ${userSchool?.email || ''}
          </div>
        </div>

        <div class="invoice-title">FACTURE DES PAIEMENTS</div>

        <div class="student-info">
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Nom de l'élève:</span>
                <span>${student?.first_name} ${student?.last_name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Classe:</span>
                <span>${student?.class_name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Niveau:</span>
                <span>${student?.level}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date d'inscription:</span>
                <span>${new Date(student?.enrollment_date).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Email parent:</span>
                <span>${student?.parent_email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Téléphone:</span>
                <span>${student?.father_phone || student?.mother_phone || 'Non renseigné'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Année scolaire:</span>
                <span>${student?.academic_year}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Statut:</span>
                <span>${student?.payment_status}</span>
              </div>
            </div>
          </div>
        </div>

        ${payments.length > 0 ? `
          <table class="payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Désignation</th>
                <th>Méthode</th>
                <th>Référence</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(payment => `
                <tr>
                  <td>${new Date(payment.payment_date).toLocaleDateString('fr-FR')}</td>
                  <td>${payment.payment_type}${payment.notes ? ` - ${payment.notes}` : ''}</td>
                  <td>${payment.payment_method?.name || 'Espèces'}</td>
                  <td>${payment.reference_number || '-'}</td>
                  <td class="amount">${payment.amount.toLocaleString()} FCFA</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="no-payments">
            Aucun paiement enregistré pour cet élève
          </div>
        `}

        <div class="summary">
          <div class="summary-title">RÉCAPITULATIF FINANCIER</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-amount total-paid">${totalPaid.toLocaleString()} FCFA</div>
              <div class="summary-label">Total Payé</div>
            </div>
            <div class="summary-item">
              <div class="summary-amount total-fees">${totalFees.toLocaleString()} FCFA</div>
              <div class="summary-label">Frais Totaux</div>
            </div>
            <div class="summary-item">
              <div class="summary-amount remaining">${remainingAmount.toLocaleString()} FCFA</div>
              <div class="summary-label">Reste à Payer</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Facture générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p>Système de Gestion Scolaire - ${userSchool?.name || 'École'}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const downloadInvoice = () => {
    const { totalPaid, totalFees, remainingAmount } = calculateTotals();
    
    // Créer les données CSV
    const csvData = [
      ['FACTURE DES PAIEMENTS'],
      [''],
      ['École:', userSchool?.name || ''],
      ['Élève:', `${student?.first_name} ${student?.last_name}`],
      ['Classe:', student?.class_name],
      ['Date d\'inscription:', new Date(student?.enrollment_date).toLocaleDateString('fr-FR')],
      [''],
      ['HISTORIQUE DES PAIEMENTS'],
      ['Date', 'Désignation', 'Méthode', 'Référence', 'Montant (FCFA)'],
      ...payments.map(payment => [
        new Date(payment.payment_date).toLocaleDateString('fr-FR'),
        payment.payment_type + (payment.notes ? ` - ${payment.notes}` : ''),
        payment.payment_method?.name || 'Espèces',
        payment.reference_number || '-',
        payment.amount.toString()
      ]),
      [''],
      ['RÉCAPITULATIF'],
      ['Total Payé:', totalPaid.toString()],
      ['Frais Totaux:', totalFees.toString()],
      ['Reste à Payer:', remainingAmount.toString()]
    ];

    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `facture_${student?.first_name}_${student?.last_name}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !student) return null;

  const { totalPaid, totalFees, remainingAmount } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Facture des Paiements</h2>
                <p className="text-gray-600">
                  {student.first_name} {student.last_name} • {student.class_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadInvoice}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={printInvoice}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimer</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* En-tête de facture */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-blue-600">{userSchool?.name}</h3>
                <p className="text-gray-600">{userSchool?.address}</p>
                <p className="text-sm text-gray-500">
                  Tél: {userSchool?.phone} • Email: {userSchool?.email}
                </p>
              </div>
            </div>
            <h4 className="text-xl font-semibold text-gray-800">FACTURE DES PAIEMENTS</h4>
          </div>

          {/* Informations de l'élève */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h5 className="text-lg font-semibold text-gray-800 mb-4">Informations de l'Élève</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="font-medium text-gray-700">Nom complet:</span>
                    <span className="ml-2 text-gray-800">{student.first_name} {student.last_name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">🎓</span>
                  <div>
                    <span className="font-medium text-gray-700">Classe:</span>
                    <span className="ml-2 text-gray-800">{student.class_name} ({student.level})</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="font-medium text-gray-700">Date d'inscription:</span>
                    <span className="ml-2 text-gray-800">{formatDate(student.enrollment_date)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="font-medium text-gray-700">Email parent:</span>
                    <span className="ml-2 text-gray-800">{student.parent_email}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="font-medium text-gray-700">Téléphone:</span>
                    <span className="ml-2 text-gray-800">{student.father_phone || student.mother_phone || 'Non renseigné'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">📅</span>
                  <div>
                    <span className="font-medium text-gray-700">Année scolaire:</span>
                    <span className="ml-2 text-gray-800">{student.academic_year}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des paiements */}
          <div className="mb-6">
            <h5 className="text-lg font-semibold text-gray-800 mb-4">Historique des Paiements</h5>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement de l'historique...</p>
              </div>
            ) : payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Désignation</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Méthode</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Référence</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment, index) => (
                      <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          <div>
                            <span className="font-medium">{payment.payment_type}</span>
                            {payment.notes && (
                              <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {payment.payment_method?.name || 'Espèces'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {payment.reference_number || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun paiement enregistré</p>
                <p className="text-sm text-gray-400">Les paiements apparaîtront ici une fois effectués</p>
              </div>
            )}
          </div>

          {/* Récapitulatif financier */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h5 className="text-lg font-semibold text-blue-800 mb-4">Récapitulatif Financier</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {formatCurrency(totalPaid)}
                </div>
                <div className="text-sm text-gray-600">Total Payé</div>
                <div className="text-xs text-gray-500 mt-1">
                  {payments.length} paiement(s)
                </div>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {formatCurrency(totalFees)}
                </div>
                <div className="text-sm text-gray-600">Frais Totaux</div>
                <div className="text-xs text-gray-500 mt-1">
                  Année {student.academic_year}
                </div>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg">
                <div className={`text-2xl font-bold mb-2 ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(remainingAmount)}
                </div>
                <div className="text-sm text-gray-600">Reste à Payer</div>
                <div className="text-xs text-gray-500 mt-1">
                  {remainingAmount > 0 ? 'Paiement en attente' : 'Soldé'}
                </div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Progression du paiement</span>
                <span className="font-medium text-gray-800">
                  {totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    remainingAmount === 0 ? 'bg-green-600' :
                    totalPaid > 0 ? 'bg-blue-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${totalFees > 0 ? Math.min((totalPaid / totalFees) * 100, 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Informations légales */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Cette facture est générée automatiquement par le système de gestion scolaire.
              Pour toute question, veuillez contacter l'administration de l'école.
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              Document généré le {formatDate(new Date().toISOString(), 'datetime')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInvoiceModal;