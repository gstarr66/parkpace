// Entity IDs on themeparks.wiki — these are stable, permanent IDs
export type Park = {
  id: string;
  name: string;
  shortName: string;
};

export const PARKS: Park[] = [
  { id: '75ea578a-adc8-4116-a54d-dccb60765ef9', name: 'Magic Kingdom', shortName: 'MK' },
  { id: '47f90d2c-e191-4239-a466-5892ef59a88b', name: 'EPCOT', shortName: 'EPCOT' },
  { id: '288747d1-8b4f-4a64-867e-ea7c9b27bad8', name: 'Hollywood Studios', shortName: 'HS' },
  { id: '1c84a229-8862-4648-9c71-378ddd2c7693', name: 'Animal Kingdom', shortName: 'AK' },
];
