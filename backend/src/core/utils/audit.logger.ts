export function logAudit(adminId: string, action: string, targetEntity: string, details: any = null) {
  console.log(`[AUDIT] [${new Date().toISOString()}] Admin: ${adminId} | Action: ${action} | Target: ${targetEntity} | Details: ${JSON.stringify(details)}`);
}
