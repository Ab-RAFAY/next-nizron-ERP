'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Space,
  Input,
  Drawer,
  App,
  Tag,
  Card,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { vendorApi } from '@/lib/api';

import VendorForm from './VendorForm';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import { useStatsDrawer } from '@/lib/stats-drawer-context';

const { Search } = Input;

interface Vendor extends Record<string, unknown> {
  id: number;
  vendor_id?: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  category?: string;
  status: string;
}

export default function VendorsPage() {
  const { open: statsOpen, closeStats } = useStatsDrawer();
  const router = useRouter();
  const { message } = App.useApp();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchText, setSearchText] = useState('');

  const fetchVendors = async () => {
    setLoading(true);
    const response = await vendorApi.getAll();
    setLoading(false);

    if (response.error) {
      message.error('Failed to fetch vendors: ' + response.error);
      return;
    }

    const vendorData = (response.data as any)?.vendors || (response.data as any) || [];
    setVendors(vendorData);
    setFilteredVendors(vendorData);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (!searchText) {
      setFilteredVendors(vendors);
      return;
    }

    const filtered = vendors.filter(vendor =>
      vendor.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      vendor.company_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      vendor.phone?.includes(searchText) ||
      vendor.category?.toLowerCase().includes(searchText.toLowerCase()) ||
      vendor.vendor_id?.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredVendors(filtered);
  }, [searchText, vendors]);

  const handleAddVendor = () => {
    setEditingVendor(null);
    setDrawerVisible(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setDrawerVisible(true);
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    const response = await vendorApi.delete(vendor.id);
    if (response.error) {
      message.error('Failed to delete vendor: ' + response.error);
      return;
    }
    message.success('Vendor deleted successfully');
    fetchVendors();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    const response = editingVendor
      ? await vendorApi.update(editingVendor.id, values)
      : await vendorApi.create(values);

    if (response.error) {
      message.error(`Failed to ${editingVendor ? 'update' : 'create'} vendor: ` + response.error);
      return;
    }

    message.success(`Vendor ${editingVendor ? 'updated' : 'created'} successfully`);
    setDrawerVisible(false);
    fetchVendors();
  };

  const handleRowClick = (vendor: Vendor) => {
    router.push(`/dashboard/vendors/${vendor.id}`);
  };

  const columns = [
    {
      title: 'Vendor ID',
      dataIndex: 'vendor_id',
      key: 'vendor_id',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Vendor) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditVendor(record);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteVendor(record);
            }}
          />
        </Space>
      ),
    },
  ];

  // Calculate statistics for dashboard cards
  const activeVendors = filteredVendors.filter(v => v.status === 'active').length;
  const totalVendors = filteredVendors.length;
  const inactiveVendors = totalVendors - activeVendors;

  // Category breakdown for chart
  const categoryMap: Record<string, number> = {};
  filteredVendors.forEach(v => {
    const cat = v.category || 'Uncategorized';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryLabels = Object.keys(categoryMap);
  const categoryCounts = Object.values(categoryMap);
  const categoryColors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#1f1f1f', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShopOutlined /> Vendor Management
          </h1>
        </div>
        <Space size={6}>
          <Search
            placeholder="Search vendors..."
            allowClear
            style={{ width: 240 }}
            size="small"
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchVendors} loading={loading}>Refresh</Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddVendor}>Add Vendor</Button>
        </Space>
      </div>

      <Drawer title="Vendor Statistics" placement="right" open={statsOpen} onClose={closeStats}>
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={8}><Card size="small"><div className="text-center"><div style={{ fontSize: 22, fontWeight: 700, color: '#1677ff' }}>{totalVendors}</div><div style={{ fontSize: 11, color: '#8c8c8c' }}>Total</div></div></Card></Col>
          <Col xs={24} sm={8}><Card size="small"><div className="text-center"><div style={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}>{activeVendors}</div><div style={{ fontSize: 11, color: '#8c8c8c' }}>Active</div></div></Card></Col>
          <Col xs={24} sm={8}><Card size="small"><div className="text-center"><div style={{ fontSize: 22, fontWeight: 700, color: '#ff4d4f' }}>{inactiveVendors}</div><div style={{ fontSize: 11, color: '#8c8c8c' }}>Inactive</div></div></Card></Col>
        </Row>
        <PieChart data={{ labels: ['Active', 'Inactive'], datasets: [{ label: 'Status', data: [activeVendors, inactiveVendors], backgroundColor: ['#52c41a', '#ff4d4f'], borderColor: ['#52c41a', '#ff4d4f'], borderWidth: 1 }] }} title="Status Distribution" />
      </Drawer>

      <Table
        columns={columns}
        dataSource={filteredVendors}
        rowKey="id"
        loading={loading}
        size="small"
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          total: filteredVendors.length,
          pageSize: 20,
          showSizeChanger: true,
          size: 'small',
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} vendors`,
        }}
        scroll={{ x: 900, y: 'calc(100vh - 220px)' }}
      />

      <Drawer
        title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
        size="large"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        <VendorForm
          initialValues={editingVendor}
          onSubmit={handleSubmit}
          onCancel={() => setDrawerVisible(false)}
        />
      </Drawer>
    </div>
  );
}