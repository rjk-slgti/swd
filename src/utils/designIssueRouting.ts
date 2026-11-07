/** Route a review issue to the closest editable workflow step. */
export function getIssueStepId(section: string): string {
  const value = section.toLowerCase();

  if (value.includes('standard') || value.includes('wpsf') || value.includes('factor governance')) return 'standards';
  if (value.includes('source') || value.includes('supply')) return 'step5';
  if (value.includes('occupan') || value.includes('population')) return 'step2';
  if (value.includes('special') || value.includes('canteen') || value.includes('irrigation')) return 'step4';
  if (value.includes('water balance') || value.includes('continuity')) return 'step5';
  if (value.includes('peak') || value.includes('fixture') || value.includes('loading')) return 'step6';
  if (value.includes('storage') || value.includes('tank')) return 'step7';
  if (value.includes('pump')) return 'step8';
  if (value.includes('pipe') || value.includes('hydraulic') || value.includes('velocity') || value.includes('headloss')) return 'pipes';
  if (value.includes('hot water') || value.includes('legionella')) return 'hotwater';
  if (value.includes('waste') || value.includes('sewage') || value.includes('drainage')) return 'step9';
  if (value.includes('rain')) return 'step10';
  if (value.includes('grey') || value.includes('gray')) return 'step11';
  if (value.includes('fire')) return 'step12';
  if (value.includes('submeter') || value.includes('meter')) return 'submetering';
  if (value.includes('sustainab') || value.includes('green') || value.includes('efficiency')) return 'step13';
  if (value.includes('review') || value.includes('checklist') || value.includes('qa') || value.includes('validation')) return 'step14';
  if (value.includes('report') || value.includes('export') || value.includes('persistence')) return 'step15';
  if (value.includes('domestic') || value.includes('average daily') || value.includes('maximum daily') || value.includes('demand')) return 'step3';
  return 'dashboard';
}
