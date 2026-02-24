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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center">
          <ShopOutlined className="mr-2" />
          Vendor Management
        </h1>
        
        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} md={8}>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalVendors}</div>
                <div className="text-gray-600">Total Vendors</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{activeVendors}</div>
                <div className="text-gray-600">Active Vendors</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{inactiveVendors}</div>
                <div className="text-gray-600">Inactive Vendors</div>
              </div>
            </Card>
          </Col>
        </Row>

        <div className="flex justify-between items-center">
          <Space>
            <Search
              placeholder="Search vendors..."
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchVendors}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddVendor}
          >
            Add Vendor
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredVendors}
        rowKey="id"
        loading={loading}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          total: filteredVendors.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} vendors`,
        }}
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