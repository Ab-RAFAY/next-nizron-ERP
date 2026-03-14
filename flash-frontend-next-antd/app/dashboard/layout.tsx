'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Badge } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CarOutlined,
  DollarOutlined,
  ShopOutlined,
  ToolOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  DashboardOutlined,
  CalendarOutlined,
  SafetyOutlined,
  WalletOutlined,
  SettingOutlined,
  BellOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  AppstoreOutlined,
  BulbOutlined,
  ShoppingOutlined,
  MessageOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { StatsDrawerProvider, useStatsDrawer } from '@/lib/stats-drawer-context';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StatsDrawerProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </StatsDrawerProvider>
  );
}

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const { toggleStats } = useStatsDrawer();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'hr',
      icon: <TeamOutlined />,
      label: 'Human Resources',
      hidden: !user.is_superuser && !user.permissions?.includes('hr'),
      children: [
        { key: '/dashboard/employees', icon: <UserOutlined />, label: 'Employees' },
        { key: '/dashboard/attendance', icon: <ClockCircleOutlined />, label: 'Attendance' },
        { key: '/dashboard/leave', icon: <CalendarOutlined />, label: 'Long Leave' },
        { key: '/dashboard/payroll', icon: <DollarOutlined />, label: 'Payroll' },
      ],
    },
    {
      key: 'fleet',
      icon: <CarOutlined />,
      label: 'Fleet Management',
      hidden: !user.is_superuser && !user.permissions?.includes('fleet'),
      children: [
        { key: '/dashboard/vehicles', icon: <CarOutlined />, label: 'Vehicles' },
        { key: '/dashboard/fleet/assignments', icon: <FileDoneOutlined />, label: 'Assignments' },
        { key: '/dashboard/fleet/fuel-entries', icon: <DollarOutlined />, label: 'Fuel Entries' },
        { key: '/dashboard/fleet/maintenance', icon: <ToolOutlined />, label: 'Maintenance' },
      ],
    },
    {
      key: 'operations',
      icon: <AppstoreOutlined />,
      label: 'Operations',
      hidden: !user.is_superuser && !user.permissions?.includes('operations'),
      children: [
        { key: '/dashboard/clients', icon: <ShopOutlined />, label: 'Clients' },
        { key: '/dashboard/clients/complaints', icon: <BulbOutlined />, label: 'Complaints' },
        { key: '/dashboard/vendors', icon: <TeamOutlined />, label: 'Vendors' },
        { key: '/dashboard/purchases', icon: <ShoppingOutlined />, label: 'Purchases' },
        { key: '/dashboard/finance', icon: <WalletOutlined />, label: 'Finance' },
        { key: '/dashboard/finance/advances', icon: <DollarOutlined />, label: 'Advances' },
      ],
    },
    {
      key: '/dashboard/chat',
      icon: <MessageOutlined />,
      label: 'Chat',
      hidden: !user.is_superuser && !user.permissions?.includes('chat'),
    },
    {
      key: 'inventory',
      icon: <SafetyOutlined />,
      label: 'Inventory',
      hidden: !user.is_superuser && !user.permissions?.includes('inventory'),
      children: [
        { key: '/dashboard/inventory/general', icon: <ToolOutlined />, label: 'General Items' },
        { key: '/dashboard/inventory/restricted', icon: <SafetyOutlined />, label: 'Restricted Items' },
      ],
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      hidden: !user.is_superuser && !user.permissions?.includes('administration'),
    },
    {
      key: 'administration',
      icon: <SettingOutlined />,
      label: 'Administration',
      hidden: !user.is_superuser && !user.permissions?.includes('administration'),
      children: [
        { key: '/dashboard/administration/roles', icon: <SafetyOutlined />, label: 'Roles & Permissions' },
      ],
    },
  ].filter((item) => !(item as any).hidden);

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ─── Sidebar ────────────────────────────────── */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={232}
        collapsedWidth={60}
        style={{
          overflow: 'hidden',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#001529',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0 12px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: collapsed ? 36 : 110,
              height: collapsed ? 36 : 38,
              transition: 'all 0.2s',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <img
              src="/images/images.png"
              alt="Nizron Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['hr', 'fleet', 'operations', 'inventory']}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) router.push(key);
          }}
          style={{
            borderRight: 0,
            paddingTop: 6,
            fontSize: 13,
            background: '#001529',
          }}
        />
      </Sider>

      {/* ─── Main Area ──────────────────────────────── */}
      <Layout
        style={{
          marginLeft: collapsed ? 60 : 232,
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          background: '#f5f5f5',
        }}
      >
        {/* Header */}
        <Header
          style={{
            background: '#ffffff',
            padding: '0 16px',
            height: 50,
            lineHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {/* Toggle button */}
          <Button
            type="text"
            size="small"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, color: '#595959' }}
          />

          {/* Right section */}
          <Space size={8}>
            <Button
              type="default"
              size="small"
              icon={<BarChartOutlined />}
              onClick={toggleStats}
              style={{ fontSize: 12, borderRadius: 4 }}
            >
              Stats
            </Button>

            <Badge count={0} showZero={false}>
              <Button
                type="text"
                size="small"
                icon={<BellOutlined style={{ fontSize: 16, color: '#595959' }} />}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  transition: 'background 0.2s',
                }}
                className="hover:bg-gray-50"
              >
                <Avatar
                  size={28}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1677ff', flexShrink: 0 }}
                />
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1f1f1f' }}>
                    {user.name || 'Admin'}
                  </div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{user.email}</div>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '14px 14px 14px',
            padding: '16px',
            background: '#ffffff',
            borderRadius: 6,
            minHeight: 'calc(100vh - 78px)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
