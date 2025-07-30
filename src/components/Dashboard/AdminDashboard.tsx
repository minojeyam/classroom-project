import React, { useEffect, useState } from "react";
import {
  Users,
  MapPin,
  BookOpen,
  DollarSign,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import StatsCard from "./StatsCard";
import { noticesAPI, usersAPI, classesAPI, locationsAPI, feesAPI } from "../../utils/api";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
interface Notice {
  _id: string;
  title: string;
  description: string;
  date: string;
  type?: string;
}

interface LocationRevenue {
  locationId: string;
  locationName: string;
  totalClasses: number;
  totalStudents: number;
  monthlyRevenue: number;
  receivedAmount: number;
  pendingAmount: number;
  collectionRate: number;
  // classes: ClassRevenue[];
}

const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [classOverview, setClassOverview] = useState<any>(null);
  const [locationOverview, setLocationOverview] = useState<any>(null);
  const [pendingAprovals, setPendingAprovales] = useState<any>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationRevenue, setLocationRevenue] = useState<LocationRevenue[]>([]);
  
  // Fetch data
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);

        const [userResponse, classesResponse, locationsResponse, pendingAprovals] = await Promise.all([
          usersAPI.getStatusOverview(),
          classesAPI.classOverview(),
          locationsAPI.locationOverview(),
          usersAPI.getPendingApprovals()
        ]);

        setOverview(userResponse.data);
        setClassOverview(classesResponse.data);
        setLocationOverview(locationsResponse.data);
        setPendingAprovales(pendingAprovals.data);

      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
    fetchNotices();
    fetchLocations()
  }, []);

  const fetchNotices = async () => {
    try {
      const data = await noticesAPI.getNotices();
      const upcoming = (data || []).filter((notice: any) => {
        const noticeDate = new Date(notice.date);
        return noticeDate >= new Date();
      });
      upcoming.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setNotices(upcoming);
    } catch (err: any) {
      console.error(err.message || "Failed to fetch notices");
    }
  };

  const fetchLocations = async () => {
    const token = localStorage.getItem("token") || undefined;
    try {
      const locationResponse = await feesAPI.getLocationFromClasses(token);
  
      if (locationResponse.status !== "success") {
        throw new Error(locationResponse.message || "Failed to fetch location revenue");
      }
  
      // Get total revenue directly from response
      const totalRevenue = locationResponse.data.overall?.totalFee ?? 0;
  
      // Map location details
      const mappedLocationRevenue: LocationRevenue[] = locationResponse.data.locations.map(
        (loc: any) => ({
          locationId: loc.location,
          locationName: loc.location,
          totalClasses: loc.totalClasses,
          totalStudents: 0,
          monthlyRevenue: loc.totalFee,
          receivedAmount: loc.totalFee,
          pendingAmount: 0,
          collectionRate: 100,
          classes: loc.classes.map((cls: any) => ({
            classId: cls.classId,
            className: cls.title,
            subject: "",
            level: "",
            teacherName: "",
            studentCount: 0,
            monthlyFee: cls.feeTotal,
            totalRevenue: cls.feeTotal,
            receivedAmount: cls.feeTotal,
            pendingAmount: 0,
            collectionRate: 100,
            students: [],
          })),
        })
      );
  
      // set state
      setLocationRevenue(mappedLocationRevenue);
  
      // store or log total revenue
      console.log("Total Revenue:", totalRevenue);
  
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };
  

  const [chartData, setChartData] = useState([
    { month: "Jan", revenue: 32000 },
    { month: "Feb", revenue: 40000 },
    { month: "Mar", revenue: 38000 },
    { month: "Apr", revenue: 42000 },
    { month: "May", revenue: 45000 },
    { month: "Jun", revenue: 48250 },
  ]);

  if (loading) return <p>Loading...</p>;
  if (!overview) return <p>No data available</p>;

  // Dashboard cards with mini chart data
  const stats = [
    {
      title: "Total Students",
      value: overview.students.count || 0,
      icon: Users,
      color: "teal" as const,
      trend: { value: overview.students.trend.value || 0, isPositive: overview.students.trend.value >= 0 },
      chartData: [{ value: 4 }, { value: 6 }, { value: 8 }, { value: overview.students.count || 0 }],
    },
    {
      title: "Total Teachers",
      value: overview.teachers.count || 0,
      icon: UserCheck,
      color: "coral" as const,
      trend: { value: overview.teachers.trend.value || 0, isPositive: overview.teachers.trend.value >= 0 },
      chartData: [{ value: 1 }, { value: 1 }, { value: 2 }, { value: overview.teachers.count || 0 }],
    },
    {
      title: "Total Classes",
      value: classOverview.totalClasses || 0,
      icon: BookOpen,
      color: "green" as const,
      trend: { value: classOverview.percentageChange || 0, isPositive: classOverview.percentageChange >= 0 },
      chartData: [{ value: 2 }, { value: 3 }, { value: 4 }, { value: classOverview.totalClasses || 0 }],
    },
    {
      title: "Locations",
      value: locationOverview.stats.totalLocations || 0,
      icon: MapPin,
      color: "purple" as const,
      trend: { value: locationOverview.trends.activeLocations.value, isPositive: locationOverview.trends.activeLocations.value >= 0 },
      chartData: [{ value: 1 }, { value: 2 }, { value: 3 }, { value: locationOverview.stats.totalLocations || 0 }],
    },
    {
      title: "Monthly Revenue",
      value: "$48,250",
      icon: DollarSign,
      color: "blue" as const,
      trend: { value: 15, isPositive: true },
      chartData: [{ value: 40000 }, { value: 42000 }, { value: 45000 }, { value: 48250 }],
    },
    {
      title: "Attendance Rate",
      value: "94.2%",
      icon: TrendingUp,
      color: "green" as const,
      trend: { value: 2, isPositive: true },
      chartData: [{ value: 90 }, { value: 92 }, { value: 94 }, { value: 94.2 }],
    },
    {
      title: "Pending Approvals",
      value: pendingAprovals.totalPending,
      icon: AlertCircle,
      color: "orange" as const, 
      trend: { value: pendingAprovals.monthly.trend?.value || 0, isPositive: pendingAprovals.monthly.trend?.value >= 0 },
      chartData: [{ value: 1 }, { value: 2 }, { value: 2 }, { value: pendingAprovals.totalPending }],
    },
    {
      title: "Overdue Payments",
      value: "$12,450",
      icon: Calendar,
      color: "coral" as const,
      trend: { value: -5, isPositive: false },
      chartData: [{ value: 15000 }, { value: 14000 }, { value: 13000 }, { value: 12450 }],
    },
  ];

  // const recentActivities = [
  //   { id: 1, message: "New teacher registration pending approval", time: "5 min ago" },
  //   { id: 2, message: "Payment received from John Doe", time: "10 min ago" },
  //   { id: 3, message: 'New class "Advanced Mathematics" created', time: "20 min ago" },
  //   { id: 4, message: "Downtown location capacity updated", time: "35 min ago" },
  //   { id: 5, message: "Attendance marked for Class 7A", time: "1 hour ago" },
  // ]; 



  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="space-y-6">
      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
    </div>
  );
};

export default AdminDashboard;




