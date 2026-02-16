// export const BASE_URL = 'https://admin.easyreppo.in/new_api/';
export const BASE_URL = 'https://admin.easyreppo.in/api-1.0.1/';
// export const BASE_URL = 'https://admin.easyreppo.in/new_api_dev/';
// export const BASE_URL = 'https://easyreppo.com/admin/api-1.0/';
// export const BASE_URL = 'https://api1.easyreppo.in/';

// ye sare images ke liye hai link
export const IMAGE_BASE_URL = 'https://easyreppo.in/';



export const ENDPOINTS = {
  LOGIN: `${BASE_URL}login.php`,
  List_Staff: `${BASE_URL}list_staff.php`,
  Add_Staff: `${BASE_URL}add_staff.php`,
  Staff_Schedule_List: `${BASE_URL}list_schedule.php`,
  Add_Schedule: `${BASE_URL}add_schedule.php`,
  search_history_paginate: `${BASE_URL}search_history_paginate.php`,
  Delete_Staff: `${BASE_URL}delete_staff.php`,
  Update_Staff: `${BASE_URL}update_staff.php`,
  Delete_Schedule: `${BASE_URL}delete_schedule.php`,
  Update_Schedule: `${BASE_URL}update_schedule.php`,
  Intimation_Vehicle: `${BASE_URL}intimation_vehicle.php`,
  Add_Intimation: `${BASE_URL}add_intimation.php`,
  Search_Schedule: `${BASE_URL}search_schedule.php`,
  Area_list: `${BASE_URL}area_list.php`,
  Add_Area: `${BASE_URL}add_area.php`,
  Intimation_List: `${BASE_URL}intimation_list.php`,
  Delete_Area: `${BASE_URL}delete_area.php`,
  Update_Area: `${BASE_URL}update_area.php`,
  Mail_Send_Pdf: `${BASE_URL}mail_send_pdf.php`,
  reset_Device_Id: `${BASE_URL}reset_device.php`,
  Staff_Internet_Access: `${BASE_URL}staff_internet_access.php`,
  Staff_Account_Status: `${BASE_URL}staff_account_status.php`,
  finance_update: `${BASE_URL}finance_update.php`,
  Search_Vehicle: `${BASE_URL}search_vehicle.php`,
  AddSubAdmin_History: `${BASE_URL}add_sub_admin_vehicle_history.php`,
  Agency_List: `${BASE_URL}agency_list.php`,
  List_Staff_Subadmin: `${BASE_URL}list_agency_subadmin.php`,
  Add_Agency_Staff: `${BASE_URL}add_agency_staff.php`,
  Staff_Agency_Delete: `${BASE_URL}staff_agency_delete.php`,
  Staff_Agency_Logout: `${BASE_URL}staff_agency_logout.php`,
  update_agency_staff: `${BASE_URL}update_agency_staff.php`,
  Vehicle_Count: `${BASE_URL}vehicle_count.php`,
  Add_Staff_Permission: `${BASE_URL}add_staff_permission.php`,
  List_Staff_Permission: `${BASE_URL}list_staff_permission.php`,
  Update_Staff_Permission: `${BASE_URL}update_staff_permission.php`,
  add_rent_agency: `${BASE_URL}add_rent_agency.php`,
  Update_rent_agency: `${BASE_URL}update_rent_agency.php`,
  delete_rent_agency: `${BASE_URL}delete_rent_agency.php`,
  status_rent_agency: `${BASE_URL}status_rent_agency.php`,
  single_add_vehicle_list: `${BASE_URL}single_add_vehicle_list.php`,
  add_vehicle_details: `${BASE_URL}add_vehicle_details.php`,
  update_vehicle_details: `${BASE_URL}update_vehicle_details.php`,
  delete_vehicle_details: `${BASE_URL}delete_vehicle_details.php`,
  subadmin_vehicle_history_paginate: `${BASE_URL}subadmin_vehicle_history_paginate.php`,
  easyreppo_finance_update: `${BASE_URL}easyreppo_finance_update.php`,
  search_history_search: `${BASE_URL}search_history_search.php`,
  add_staff_vehicle_records: `${BASE_URL}add_staff_vehicle_records.php`,
  list_staff_vehicle_records: `${BASE_URL}list_staff_vehicle_records.php`,
  subadmin_vehicle_history_search: `${BASE_URL}subadmin_vehicle_history_search.php`,
  app_setting_time: `${BASE_URL}app_setting_time.php`,
  update_time_setting: `${BASE_URL}update_time_setting.php`,
  add_staff_blacklist: `${BASE_URL}add_staff_blacklist.php`,
  list_staff_blacklist: `${BASE_URL}list_staff_blacklist.php`,
  update_staff_blacklist: `${BASE_URL}update_staff_blacklist.php`,
  delete_staff_blacklist: `${BASE_URL}delete_staff_blacklist.php`,
  UserWiseExpiry: `${BASE_URL}user_wise_expiry.php`,

  update_sync_status: `${BASE_URL}update_sync_status.php`,
  full_vehicle_detail_csv_upload: `${BASE_URL}full_vehicle_detail_csv_upload.php`,
  upload_number_wise_export: `${BASE_URL}upload_number_wise_export.php`,







  Finance_List: (rentAgencyId, staff_id) =>
    `${BASE_URL}finance_list.php?rent_agency_id=${rentAgencyId}&staff_id=${staff_id}`,


  Rent_Finance_List: (rentAgencyId, staff_id) =>
    `${BASE_URL}rent_finance_list.php?rent_agency_id=${rentAgencyId}&staff_id=${staff_id}`,

  rent_finance_update: `${BASE_URL}rent_finance_update.php`,

  easyreppo_Finance_List: (rentAgencyId, staff_id) =>
    `${BASE_URL}easyreppo_finance_list.php?rent_agency_id=${rentAgencyId}&staff_id=${staff_id}`,

  ICard: (userId, type) =>
    `${BASE_URL}icard.php?user_id=${userId}&type=${type}`,


  ICardApi: (userId, type) =>
    `${BASE_URL}icard_api.php?user_id=${userId}&type=${type}`,

  other_app_list: `${BASE_URL}other/other_app_list.php`,
  update_finance_list: `${BASE_URL}other/update_finance_list.php`,
  other_app_list_detail: `${BASE_URL}other/other_app_list_detail.php`,
  other_app_history: `${BASE_URL}other/other_app_history.php`,
  search_other_app_history: `${BASE_URL}other/search_other_app_history.php`,
};
