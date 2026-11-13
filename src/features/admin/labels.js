export const STAGE_LABELS = {
  lead: 'Lead', survey: 'Site survey', quotation: 'Quotation sent', approved: 'Approved',
  installation: 'Installation', net_metering: 'Net-metering', completed: 'Completed',
};
export const STAGES = Object.keys(STAGE_LABELS);

export const QUOTE_LABELS = {
  new: 'New', contacted: 'Contacted', survey_booked: 'Survey booked', quoted: 'Quoted', won: 'Won', lost: 'Lost',
};
export const QUOTE_TONES = { new: 'gold', contacted: 'blue', survey_booked: 'purple', quoted: 'teal', won: 'green', lost: 'red' };

export const EVENT_LABELS = {
  site_visit: 'Site visit', installation: 'Installation', commitment: 'Commitment', meeting: 'Meeting', other: 'Other',
};
export const EVENT_COLORS = {
  site_visit: '#1a4fb4', installation: '#16a34a', commitment: '#f47b20', meeting: '#7c3aed', other: '#64748b',
};
