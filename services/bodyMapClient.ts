import axios from 'axios';

export async function fetchPreset(patientId: string) {
  const res = await axios.get(`/api/body-map?patientId=${encodeURIComponent(patientId)}&preset=true`);
  return res.data?.data ?? [];
}

export async function fetchEvolutions(patientId: string) {
  const res = await axios.get(`/api/body-map?patientId=${encodeURIComponent(patientId)}`);
  return res.data?.data ?? [];
}

export async function createEvolution(payload: any) {
  const res = await axios.post('/api/body-map', payload);
  return res.data?.data;
}


