-- ============================================
-- SEED: Masterlist of Internal Records
-- NBSC Guidance and Counseling Office
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Make sure all columns exist
ALTER TABLE folders ADD COLUMN IF NOT EXISTS record_number INTEGER;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS responsible_controller TEXT;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS storage_location TEXT;

-- Step 2: Insert the 15 folders (only if they don't already exist by name)

INSERT INTO folders (record_number, folder_name, classification, folder_password, responsible_controller, storage_location, file_count, file_urls, is_archived, archived_file_urls, custom_names)
VALUES
(1,  'Inventory Custodians Slip',                     'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1, Folder 1', 0, '{}', false, '{}', '{}'),
(2,  'Outgoing Letters',                              'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1, Folder 2', 0, '{}', false, '{}', '{}'),
(3,  'PPMP',                                          'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1, Folder 3', 0, '{}', false, '{}', '{}'),
(4,  'Minutes of Meeting (Regular Office Meeting)',   'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1, Folder 4', 0, '{}', false, '{}', '{}'),
(5,  'Incoming Letters',                              'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1, Folder 5', 0, '{}', false, '{}', '{}'),
(6,  'Attendance Sheets',                             'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1, Folder 6', 0, '{}', false, '{}', '{}'),
(7,  'Standard Operating Procedures (SOP)',           'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1, Folder 7', 0, '{}', false, '{}', '{}'),
(8,  'Activity Designs',                              'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1, Folder 8', 0, '{}', false, '{}', '{}'),
(9,  'Program Development Plan',                      'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1, Folder 9', 0, '{}', false, '{}', '{}'),
(10, 'Log Book (Counseling Appointment)',             'NON-CONFIDENTIAL', 'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'File Box 1',           0, '{}', false, '{}', '{}'),
(10, 'Test Manuals',                                  'CONFIDENTIAL',     'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'Cabinet 1, Drawer 4',  0, '{}', false, '{}', '{}'),
(11, 'Referral Forms',                                'CONFIDENTIAL',     'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'Cabinet 1',            0, '{}', false, '{}', '{}'),
(12, 'Special Cases',                                 'CONFIDENTIAL',     'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'Cabinet 1',            0, '{}', false, '{}', '{}'),
(13, 'Counseling Notes',                              'CONFIDENTIAL',     'nbsc2025', 'Jo Augustine G. Corpuz / John Ford N. Ganzan', 'Cabinet 1',            0, '{}', false, '{}', '{}'),
(14, 'Client Daily Log',                              'CONFIDENTIAL',     'nbsc2025', 'Jo Augustine G. Corpuz',                       'Cabinet 1, Drawer 4',  0, '{}', false, '{}', '{}')
ON CONFLICT DO NOTHING;
