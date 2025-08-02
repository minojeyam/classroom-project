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
  BarChart as LucideBarChart,
} from "lucide-react";
import StatsCard from "./StatsCard";
import {
  noticesAPI,
  usersAPI,
  classesAPI,
  locationsAPI,
  feesAPI,
} from "../../utils/api";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
} from "recharts";

interface Notice {
  _id: string;
  title: string;
  description: string;
  date: string;
  type?: string;
}

interface LocationFee {
  location: string;
  totalFee: number | string;
}

const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [classOverview, setClassOverview] = useState<any>(null);
  const [locationOverview, setLocationOverview] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any>(null);
  const [revenueTotals, setRevenueTotals] = useState({
    collected: 0,
    pending: 0,
  });

  const [chartData, setChartData] = useState<
    { name: string; revenue: number }[]
  >([]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);

        const [
          userResponse,
          classesResponse,
          locationsResponse,
          pendingApprovalsResponse,
          locationBasedRevenue,
        ] = await Promise.all([
          usersAPI.getStatusOverview(),
          classesAPI.classOverview(),
          locationsAPI.locationOverview(),
          usersAPI.getPendingApprovals(),
          feesAPI.getLocationFromClasses(),
        ]);

        setOverview(userResponse.data);
        setClassOverview(classesResponse.data);
        setLocationOverview(locationsResponse.data);
        setPendingApprovals(pendingApprovalsResponse.data);
        setLocations(locationBasedRevenue.data);

        setRevenueTotals({
          collected: totalCollectedResponse.data.totalCollected,
          pending: totalPendingResponse.data.totalPending,
        });

        if (
          locationBasedRevenue.data?.locations &&
          Array.isArray(locationBasedRevenue.data.locations)
        ) {
          const preparedChartData = locationBasedRevenue.data.locations.map(
            (loc: LocationFee) => ({
              name: loc.location,
              revenue: Number(loc.totalFee) || 0,
            })
          );
          setChartData(preparedChartData);
        } else {
          setChartData([]);
        }
      } catch (error) {
        console.error("Error fetching overview:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotices = async () => {
      try {
        const data = await noticesAPI.getNotices();
        const upcoming = (data || []).filter((notice: any) => {
          const noticeDate = new Date(notice.date);
          return noticeDate >= new Date();
        });
        upcoming.sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setNotices(upcoming);
      } catch (err: any) {
        console.error(err.message || "Failed to fetch notices");
      }
    };

    fetchOverview();
    fetchNotices();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!overview) return <p>No data available</p>;

  const stats = [
    {
      title: "Total Students",
      value: overview.students?.count || 0,
      icon: Users,
      color: "teal" as const,
      trend: {
        value: overview.students?.trend?.value || 0,
        isPositive: (overview.students?.trend?.value ?? 0) >= 0,
      },
      chartData: [
        { value: 4 },
        { value: 6 },
        { value: 8 },
        { value: overview.students?.count || 0 },
      ],
    },
    {
      title: "Total Teachers",
      value: overview.teachers?.count || 0,
      icon: UserCheck,
      color: "coral" as const,
      trend: {
        value: overview.teachers?.trend?.value || 0,
        isPositive: (overview.teachers?.trend?.value ?? 0) >= 0,
      },
      chartData: [
        { value: 1 },
        { value: 1 },
        { value: 2 },
        { value: overview.teachers?.count || 0 },
      ],
    },
    {
      title: "Total Classes",
      value: classOverview?.totalClasses || 0,
      icon: BookOpen,
      color: "green" as const,
      trend: {
        value: classOverview?.percentageChange || 0,
        isPositive: (classOverview?.percentageChange ?? 0) >= 0,
      },
      chartData: [
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: classOverview?.totalClasses || 0 },
      ],
    },
    {
      title: "Locations",
      value: locationOverview?.stats?.totalLocations || 0,
      icon: MapPin,
      color: "purple" as const,
      trend: {
        value: locationOverview?.trends?.activeLocations?.value || 0,
        isPositive:
          (locationOverview?.trends?.activeLocations?.value ?? 0) >= 0,
      },
      chartData: [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: locationOverview?.stats?.totalLocations || 0 },
      ],
    },
    {
      title: "Pending Approvals",
      value: pendingApprovals?.totalPending || 0,
      icon: AlertCircle,
      color: "orange" as const,
      trend: {
        value: pendingApprovals?.monthly?.trend?.value || 0,
        isPositive: (pendingApprovals?.monthly?.trend?.value ?? 0) >= 0,
      },
      chartData: [
        { value: 1 },
        { value: 2 },
        { value: 2 },
        { value: pendingApprovals?.totalPending || 0 },
      ],
    },
    {
      title: "Monthly Revenue",
      value: `LKR ${locations?.overall?.totalFee || 0}`,
      icon: DollarSign,
      color: "blue" as const,
      trend: { value: 15, isPositive: true },
      chartData: [
        { value: 40000 },
        { value: 42000 },
        { value: 45000 },
        { value: 48250 },
      ],
    },

    {
      title: "Overdue Payments",
      value: "LKR 12450",
      icon: Calendar,
      color: "coral" as const,
      trend: { value: -5, isPositive: false },
      chartData: [
        { value: 15000 },
        { value: 14000 },
        { value: 13000 },
        { value: 12450 },
      ],
    },
  ];

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
        {/* <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          * <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
          </h3> *
        </div> */}
      </div>
    </div>
  );
};

export default AdminDashboard;
