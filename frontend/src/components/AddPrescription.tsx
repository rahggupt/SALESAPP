import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_ENDPOINTS from '../config/api';

interface Medicine {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface PrescriptionMedicine {
  medicineId: string;
  dosage: string;
  duration: string;
}

const AddPrescription: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    medicines: [{ medicineId: '', dosage: '', duration: '' }],
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.MEDICINES, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicines(response.data);
    } catch (err) {
      setError('Failed to fetch medicines');
    }
  };

  const handleMedicineChange = (index: number, field: string, value: string) => {
    const newMedicines = [...formData.medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setFormData({ ...formData, medicines: newMedicines });
  };

  const addMedicine = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { medicineId: '', dosage: '', duration: '' }]
    });
  };

  const removeMedicine = (index: number) => {
    const newMedicines = formData.medicines.filter((_, i) => i !== index);
    setFormData({ ...formData, medicines: newMedicines });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(API_ENDPOINTS.PRESCRIPTIONS, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      setFormData({
        patientName: '',
        doctorName: '',
        medicines: [{ medicineId: '', dosage: '', duration: '' }],
        notes: ''
      });
    } catch (err) {
      setError('Failed to create prescription');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Add New Prescription</h2>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {success && <div className="text-green-500 mb-4">Prescription added successfully!</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient Name</label>
          <input
            type="text"
            value={formData.patientName}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Doctor Name</label>
          <input
            type="text"
            value={formData.doctorName}
            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Medicines</label>
          {formData.medicines.map((medicine, index) => (
            <div key={index} className="mt-2 p-4 border rounded-md">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medicine</label>
                  <select
                    value={medicine.medicineId}
                    onChange={(e) => handleMedicineChange(index, 'medicineId', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Medicine</option>
                    {medicines.map((med) => (
                      <option key={med._id} value={med._id}>
                        {med.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dosage</label>
                  <input
                    type="text"
                    value={medicine.dosage}
                    onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <input
                    type="text"
                    value={medicine.duration}
                    onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeMedicine(index)}
                  className="mt-2 text-red-600 hover:text-red-800"
                >
                  Remove Medicine
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addMedicine}
            className="mt-2 text-indigo-600 hover:text-indigo-800"
          >
            + Add Another Medicine
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Create Prescription
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPrescription; 