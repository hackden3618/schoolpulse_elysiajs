# 25 — Backup and Recovery Test Cases

## Table of Contents

| ID | Title |
|---|---|
| BKP-001 | Daily Backup |
| BKP-002 | Restore Backup |
| BKP-003 | Point-in-Time Recovery |
| BKP-004 | Corrupted Backup |
| BKP-005 | Disaster Recovery |
| BKP-006 | Transaction Recovery |
| BKP-007 | Backup Verification |
| BKP-008 | Encryption |
| BKP-009 | Retention Policy |
| BKP-010 | Cross-Region Restore |

---

## BKP-001 Daily Backup

**Objective:** Verify automated daily backup runs and completes

**Preconditions:**
- Scheduled backup is configured to run daily at 02:00 AM
- Database contains data

**Action:**
Wait for scheduled backup time or trigger backup manually

**Expected Behavior:**
- Backup process starts at scheduled time
- Backup completes without errors
- Backup file is created in configured storage location
- Backup file size is reasonable (non-zero)
- Backup log indicates success

**Expected Database Changes:**
- `backup_log` table: new row with status `completed`, file size, duration

**Expected Audit Log:**
- Event type: `BackupCompleted`
- Actor: System
- Details: Backup ID, file size, duration, type (full/incremental)

**Cleanup:**
- Remove test backup file if generated outside scheduled run

---

## BKP-002 Restore Backup

**Objective:** Verify data restored from backup matches the original

**Preconditions:**
- Backup file exists from a known point in time
- Test database is available for restore (separate from production)

**Action:**
1. Record current state: count of records in key tables
2. Restore database from backup
3. Compare restored data with expected state

**Expected Behavior:**
- Restore process completes without errors
- All tables and data are restored
- Record counts match expectations
- Relationships and foreign keys are intact
- Application can connect to restored database and queries work

**Verification Queries:**
- SELECT COUNT(*) FROM student -> matches expected count
- SELECT COUNT(*) FROM class -> matches expected count
- Sample record data is correct

**Cleanup:**
- Drop restored test database

---

## BKP-003 Point-in-Time Recovery

**Objective:** Verify database can be restored to a specific moment

**Preconditions:**
- WAL (Write-Ahead Log) archiving is enabled
- Full backup exists from 2026-07-14 02:00 AM
- Transactions occurred between 2026-07-14 02:00 AM and 2026-07-15 10:00 AM

**Action:**
Restore database to 2026-07-15 08:00:00

**Expected Behavior:**
- Full backup is restored
- WAL logs are replayed up to the specified timestamp
- Data after the target timestamp is NOT present
- Data before the target timestamp IS present
- Database is consistent (no partial transactions)

**Verification:**
- Record created at 2026-07-15 07:00 exists
- Record created at 2026-07-15 09:00 does not exist

**Cleanup:**
- Drop restored database

---

## BKP-004 Corrupted Backup

**Objective:** Verify corrupted backup fails gracefully with clear error

**Preconditions:**
- Backup file is intentionally corrupted (header modified, bytes removed)

**Action:**
Attempt to restore from corrupted backup

**Expected Behavior:**
- Restoration fails immediately
- Error message clearly indicates corruption:
  - "Backup file is corrupted: checksum mismatch"
  - "Backup file header is invalid"
- System does not crash
- Administrator is notified
- Previous valid backups remain unaffected

**Expected Audit Log:**
- Event type: `BackupRestoreFailed`
- Actor: System/admin
- Details: Backup ID, error message, corruption detected

**Cleanup:**
- Remove corrupted test backup file

---

## BKP-005 Disaster Recovery

**Objective:** Verify full DR process restores system in under 4 hours

**Preconditions:**
- Complete infrastructure outage simulated
- Off-site backups are available
- DR runbook is documented

**Scenario:**
Simulate complete data center failure:
1. Primary database server is offline
2. Application servers are offline
3. No access to primary infrastructure

**DR Steps:**
1. Provision new infrastructure (cloud/on-prem)
2. Restore latest valid backup
3. Restore WAL archives for point-in-time recovery
4. Configure application to point to restored database
5. Verify data integrity
6. Verify application functionality
7. Update DNS or load balancer to new servers

**Expected Threshold:**
- Total recovery time: < 4 hours
- Data loss: < 5 minutes (RPO)
- Recovery Point Objective (RPO): < 5 minutes
- Recovery Time Objective (RTO): < 4 hours

**Expected Audit Log:**
- Event type: `DisasterRecoveryExecuted`
- Actor: System admin
- Details: Recovery time, RPO achieved, RTO achieved

**Cleanup:**
- Restore primary infrastructure

---

## BKP-006 Transaction Recovery

**Objective:** Verify interrupted write recovers on restart

**Preconditions:**
- Database has WAL enabled
- A long-running transaction is in progress

**Scenario:**
1. Begin a multi-table transaction (insert student + enrollment + fee)
2. Force kill database process mid-transaction
3. Restart database

**Expected Behavior:**
- On restart, database performs crash recovery
- WAL is replayed to ensure consistency
- Incomplete transaction is rolled back
- No partial data remains
- Database starts successfully and accepts connections
- All constraints and indexes are intact

**Expected Database Changes:**
- None (transaction was rolled back)

**Verification:**
- No orphan enrollment records without parent student
- Sequence/Auto-increment values are consistent (no gaps from rolled-back txns)

**Cleanup:**
- None required

---

## BKP-007 Backup Verification

**Objective:** Verify backup checksum verification passes

**Preconditions:**
- Backup file exists

**Action:**
1. Compute checksum of original data (e.g., SHA-256 hash of key tables)
2. Run backup verification tool
3. Compare checksums

**Expected Behavior:**
- Backup verification tool reports:
  - Checksum: <hash_value>
  - Status: PASS
  - File integrity: OK
  - No corrupted blocks
- Computed checksum matches stored checksum

**Verification:**
```bash
sha256sum backup_file.sql.gz
# Compare with stored checksum in backup_log
```

**Expected Audit Log:**
- Event type: `BackupVerificationPassed`
- Actor: System
- Details: Backup ID, checksum match

**Cleanup:**
- None required

---

## BKP-008 Encryption

**Objective:** Verify backup files are encrypted at rest

**Preconditions:**
- Backup encryption is configured (AES-256-GCM or equivalent)

**Verification:**
1. Locate backup file on storage
2. Attempt to read file directly:
   - File content is binary/encrypted, not plain SQL
   - Cannot read data without decryption key
3. Attempt to restore with correct key:
   - Restoration succeeds
4. Attempt to restore with incorrect key:
   - Restoration fails with "decryption error"

**Expected Behavior:**
- Backup file header indicates encryption (e.g., `ENC-AES256-GCM`)
- File is unreadable without key
- Restore works with valid key
- Key is stored securely (vault/KMS), not in backup file

**Expected Audit Log:**
- Event type: `BackupEncryptionVerified`
- Actor: System

**Cleanup:**
- None required

---

## BKP-009 Retention Policy

**Objective:** Verify backups older than 30 days are auto-deleted

**Preconditions:**
- Retention policy configured: 30 days
- Test backups exist with varying ages:
  - 5 days old (should be kept)
  - 15 days old (should be kept)
  - 35 days old (should be deleted)

**Action:**
Trigger retention policy enforcement

**Expected Behavior:**
- Backups aged 31+ days are deleted
- Backups aged 30 or fewer days are preserved
- Deletion is logged
- At least one backup per week is preserved (if configured)

**Expected Database Changes:**
- `backup_log` table: old backups marked as `deleted` with `deletedAt` timestamp

**Expected Audit Log:**
- Event type: `BackupRetentionEnforced`
- Actor: System
- Details: Number of backups deleted, retention period applied

**Cleanup:**
- Create fresh backup if all test backups were deleted

---

## BKP-010 Cross-Region Restore

**Objective:** Verify restore from secondary/backup region

**Preconditions:**
- Backups are replicated to a secondary region
- Primary region is unavailable

**Scenario:**
Simulate primary region failure:
1. Primary region database is inaccessible
2. Initiate restore from secondary region backup

**Expected Behavior:**
- Backup from secondary region is accessible
- Restoration completes successfully
- Restored data matches the latest available backup
- Application can connect to the restored database in secondary region
- DNS/connection strings can be updated to point to secondary region

**Expected Threshold:**
- Cross-region restore time: < 6 hours
- Data consistency: 100% match with source backup checksum

**Expected Audit Log:**
- Event type: `CrossRegionRestoreCompleted`
- Actor: System admin
- Details: Source region, target region, backup timestamp, duration

**Cleanup:**
- Restore primary region and re-establish replication
