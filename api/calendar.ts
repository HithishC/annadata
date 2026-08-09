import axios from 'axios';

const BASE_URL = 'https://annadata-api-mmzk.onrender.com';

export interface CropRequest {
  cropType: string;
  sowingDate: string;
  location: string;
  variety: string;
  language: string;
}

export interface Task {
  type: string;
  title: string;
  desc: string;
  translatedTask: string;
}

export interface CalendarWeek {
  weekNum: number;
  startDate: string;
  endDate: string;
  tasks: Task[];
}

export const generateCalendar = async (data: CropRequest): Promise<CalendarWeek[]> => {
  console.log('📡 Calling API with:', JSON.stringify(data));
  
  const response = await axios.post(`${BASE_URL}/generate-calendar`, data, {
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
  });

  console.log('✅ API response status:', response.status);
  console.log('✅ Calendar weeks:', response.data?.calendar?.length);

  if (response.data?.calendar) {
    return response.data.calendar;
  }

  throw new Error('No calendar in response');
};