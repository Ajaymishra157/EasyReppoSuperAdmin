import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';

SQLite.enablePromise(true);

// 🔹 Constants
const DB_NAME = 'VehicleDB.db';

export const openDB = async () => {
  const internalPath = `${RNFS.DocumentDirectoryPath}/${DB_NAME}`;

  // Prefer the one in Downloads (public)
  const publicExists = await RNFS.exists(internalPath);
  if (publicExists) {
    // console.log("📂 Opening DB from Downloads folder:", downloadPath);
    return SQLite.openDatabase({ name: internalPath, location: 'default' });
  }
};

let indexCreated = false;
// 🔹 Ensure DB is accessible and indexes exist
export const prepareDB = async () => {
  const internalPath = `${RNFS.DocumentDirectoryPath}/${DB_NAME}`;

  const internalExists = await RNFS.exists(internalPath);
  if (!internalExists) throw new Error("❌ No DB found in internal storage!");

  const db = await SQLite.openDatabase({ name: internalPath, location: 'default' });

  try {
    if (!indexCreated) {
      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_reg_last_state_status 
        ON full_vehicle_detail (reg_last, state_code, vehicle_status);
      `);

      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_chassis_last_state_status 
        ON full_vehicle_detail (chassis_last, state_code, vehicle_status);
      `);

      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_eng_last_state_status 
        ON full_vehicle_detail (eng_last, state_code, vehicle_status);
      `);

      await db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_finance_name 
        ON full_vehicle_detail (vehicle_finance_name);
      `);

      await db.executeSql("PRAGMA analysis_limit=4000;");
      await db.executeSql("PRAGMA optimize;");
      indexCreated = true;
      console.log("✅ Indexes created & optimized");
    }
  } catch (err) {
    console.warn("⚠️ Error checking tables or creating indexes:", err.message);
  }

  return db;
};


// 🔹 Bulk insert vehicles (batched)
export const bulkInsertVehicles = async (vehicles) => {
  const BATCH_SIZE = 500;
  const db = await prepareDB();

  try {
    for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
      const batch = vehicles.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
      const values = [];
      batch.forEach(v => {
        values.push(
          v.full_vehicle_id,
          v.vehicle_excel_upload_number,
          v.vehicle_upload_file_name,
          v.vehicle_month,
          v.vehicle_finance_name,
          v.finance_name,
          v.vehicle_manager,
          v.vehicle_branch,
          v.vehicle_agreement_no,
          v.vehicle_app_id,
          v.vehicle_customer_name,
          v.vehicle_customer_number,
          v.vehicle_customer_address,
          v.vehicle_bucket,
          v.vehicle_emi,
          v.vehicle_principle_outstanding,
          v.vehicle_total_outstanding,
          v.vehicle_product,
          v.vehicle_fild_fos,
          v.vehicle_registration_no,
          v.vehicle_engine_no,
          v.vehicle_chassis_no,
          v.vehicle_repo_fos,
          v.vehicle_entry_date,
          v.vehicle_status,
          v.agency_person_name,
          v.agency_contact_number,
          v.vehicle_type,
          v.rent_agency_id,
          v.vehicle_finance_admin,
          v.state_code,
          v.reg_last,
          v.eng_last,
          v.chassis_last,
          v.data_type
        );
      });

      const sql = `
        INSERT INTO full_vehicle_detail (
          full_vehicle_id, vehicle_excel_upload_number, vehicle_upload_file_name, vehicle_month,
          vehicle_finance_name, finance_name, vehicle_manager, vehicle_branch, vehicle_agreement_no,
          vehicle_app_id, vehicle_customer_name, vehicle_customer_number,
          vehicle_customer_address, vehicle_bucket, vehicle_emi,
          vehicle_principle_outstanding, vehicle_total_outstanding, vehicle_product,
          vehicle_fild_fos, vehicle_registration_no, vehicle_engine_no, vehicle_chassis_no,
          vehicle_repo_fos, vehicle_entry_date, vehicle_status, agency_person_name,
          agency_contact_number, vehicle_type, rent_agency_id, vehicle_finance_admin,
          state_code, reg_last, eng_last, chassis_last, data_type
        ) VALUES ${placeholders};
      `;
      await db.executeSql(sql, values);
    }
    console.log(`✅ Inserted ${vehicles.length} vehicles`);
  } catch (err) {
    console.log('❌ bulkInsertVehicles error:', err);
    throw err;
  }
};

// 🔹 Get all vehicles
export const getAllVehicles = async () => {
  try {
    const db = await prepareDB();
    const [results] = await db.executeSql('SELECT * FROM full_vehicle_detail');
    const vehicles = [];
    for (let i = 0; i < results.rows.length; i++) vehicles.push(results.rows.item(i));
    return vehicles;
  } catch (err) {
    console.error('❌ getAllVehicles error:', err);
    return [];
  }
};

// 🔹 Paginated fetch
export const getVehiclesPaginated = async (offset, limit) => {
  try {
    const db = await prepareDB();
    const [results] = await db.executeSql('SELECT * FROM full_vehicle_detail LIMIT ? OFFSET ?', [limit, offset]);
    const vehicles = [];
    for (let i = 0; i < results.rows.length; i++) vehicles.push(results.rows.item(i));
    return vehicles;
  } catch (err) {
    console.log('❌ getVehiclesPaginated error:', err);
    return [];
  }
};

// 🔹 Fetch all vehicle records safely with logs
export const fetchAllRecords = async () => {
  try {
    const db = await prepareDB(); // ensure DB is ready
    console.log("📦 Fetching all records from full_vehicle_detail...");

    const [results] = await db.executeSql("SELECT * FROM full_vehicle_detail");
    const allVehicles = [];

    for (let i = 0; i < results.rows.length; i++) {
      allVehicles.push(results.rows.item(i));
    }

    console.log(`✅ Total records fetched: ${allVehicles.length}`);

    // 👇 Log only the first record (if available)
    if (allVehicles.length > 0) {
      console.log("🔹 First record:", allVehicles[0]);
    } else {
      console.log("⚠️ No records found in full_vehicle_detail.");
    }

    return allVehicles;
  } catch (err) {
    console.log("❌ fetchAllRecords error:", err.message);
    return [];
  }
};

// 🔹 Mark vehicle deactive in SQLite
export const deactivateVehicleInSQLite = async (vehicleId) => {
  try {
    const db = await prepareDB();

    // Update only if data_type = 'self'
    await db.executeSql(
      "UPDATE full_vehicle_detail SET vehicle_status = ? WHERE full_vehicle_id = ? AND data_type = 'self'",
      ["Deactive", vehicleId]
    );

    console.log("✅ Vehicle deactivated (self only) in SQLite:", vehicleId);

    // Count deactive vehicles where data_type = 'self'
    const [res] = await db.executeSql(
      "SELECT COUNT(*) AS total FROM full_vehicle_detail WHERE vehicle_status = ? AND data_type = 'self'",
      ["Deactive"]
    );

    const count = res.rows.item(0).total;
    console.log("🔴 Total Deactivated Self Vehicles:", count);

    return count;
  } catch (err) {
    console.log("❌ deactivateVehicleInSQLite error:", err.message);
  }
};

export const restoreVehicleInSQLite = async (vehicleId) => {
  try {
    const db = await prepareDB();

    // Update status only if data_type = 'self'
    await db.executeSql(
      "UPDATE full_vehicle_detail SET vehicle_status = ? WHERE full_vehicle_id = ? AND data_type = 'self'",
      ["Active", vehicleId]
    );

    console.log("✅ Vehicle restored (self only) in SQLite:", vehicleId);

    // Count active vehicles where data_type = 'self'
    const [res] = await db.executeSql(
      "SELECT COUNT(*) AS total FROM full_vehicle_detail WHERE vehicle_status = ? AND data_type = 'self'",
      ["Active"]
    );

    const count = res.rows.item(0).total;
    console.log("🟢 Total Active Self Vehicles:", count);

    return count;
  } catch (err) {
    console.log("❌ restoreVehicleInSQLite error:", err.message);
  }
};





