export function trackByFn(fieldName: string = 'id'): Function {
  return (index: number, item: any) => (item && item[fieldName]) || null;
}
