export interface ConvocatoriaRosterStudent {
  id: string;
  rut?: string;
  fullName: string;
  generation: string;
  phone?: string;
}

export interface ConvocatoriaRoster {
  tenant: string;
  convocatoriaSlug: string;
  formId: string;
  students: ConvocatoriaRosterStudent[];
  updatedAt: string;
}
