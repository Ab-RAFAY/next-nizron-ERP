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
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { purchaseApi, vendorApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

import PurchaseForm from './PurchaseForm';

const { Search } = Input;
const { Option } = Select;

interface Purchase extends Record<string, unknown> {
  id: number;
  purchase_order: string;
  vendor_id: number;
  vendor_name?: string;
  date: string;
  amount: number;
  status: string;
  description?: string;
}

interface Vendor {
  id: number;
  name: string;
  company_name?: string;
}

export default function PurchasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Check if user is admin (you can modify this logic based on your auth system)
  const isAdmin = user?.email?.includes('admin') || user?.email === 'admin@example.com';

  const fetchPurchases = async () => {
    setLoading(true);
    const response = await purchaseApi.getAll();
    setLoading(false);

    if (response.error) {
      message.error('Failed to fetch purchases: ' + response.error);
      return;
    }

    const purchaseData = (response.data as any)?.purchases || (response.data as any) || [];
    setPurchases(purchaseData);
    setFilteredPurchases(purchaseData);
  };

  const fetchVendors = async () => {
    const response = await vendorApi.getAll();
    if (!response.error) {
      const vendorData = (response.data as any)?.vendors || (response.data as any) || [];
      setVendors(vendorData);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchVendors();
  }, []);

  useEffect(() => {
    let filtered = purchases;

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(purchase =>
        purchase.purchase_order?.toLowerCase().includes(searchText.toLowerCase()) ||
        purchase.vendor_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        purchase.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        purchase.amount?.toString().includes(searchText)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.status === statusFilter);
    }

    setFilteredPurchases(filtered);
  }, [searchText, statusFilter, purchases]);

  const handleAddPurchase = () => {
    if (!isAdmin) {
      message.warning('Only administrators can add purchases');
      return;
    }
    setEditingPurchase(null);
    setDrawerVisible(true);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    if (!isAdmin) {
      message.warning('Only administrators can edit purchases');
      return;
    }
    setEditingPurchase(purchase);
    setDrawerVisible(true);
  };

  const handleDeletePurchase = async (purchase: Purchase) => {
    if (!isAdmin) {
      message.warning('Only administrators can delete purchases');
      return;
    }
    
    const response = await purchaseApi.delete(purchase.id);
    if (response.error) {
      message.error('Failed to delete purchase: ' + response.error);
      return;
    }
    message.success('Purchase deleted successfully');
    fetchPurchases();
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!isAdmin) {
      message.warning('Only administrators can modify purchases');
      return;
    }

    const response = editingPurchase
      ? await purchaseApi.update(editingPurchase.id, values)
      : await purchaseApi.create(values);

    if (response.error) {
      message.error(`Failed to ${editingPurchase ? 'update' : 'create'} purchase: ` + response.error);
      return;
    }

    message.success(`Purchase ${editingPurchase ? 'updated' : 'created'} successfully`);
    setDrawerVisible(false);
    fetchPurchases();
  };

  const handleRowClick = (purchase: Purchase) => {
    router.push(`/dashboard/purchases/${purchase.id}`);
  };

  const columns = [
    {
      title: 'Purchase Order',
      dataIndex: 'purchase_order',
      key: 'purchase_order',
      width: 150,
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => `$${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        let color = 'default';
        if (status === 'completed') color = 'green';
        else if (status === 'pending') color = 'orange';
        else if (status === 'cancelled') color = 'red';
        else if (status === 'approved') color = 'blue';
        
        return (
          <Tag color={color}>
            {status?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Purchase) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/purchases/${record.id}`);
            }}
          />
          {isAdmin && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPurchase(record);
                }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePurchase(record);
                }}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  // Calculate statistics for dashboard cards
  const totalAmount = filteredPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedPurchases = filteredPurchases.filter(p => p.status === 'completed').length;
  const pendingPurchases = filteredPurchases.filter(p => p.status === 'pending').length;
  const totalPurchases = filteredPurchases.length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center">
          <ShoppingOutlined className="mr-2" />
          Purchase Management
        </h1>
        
        {/* Permission Notice */}
        {!isAdmin && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You have read-only access. Only administrators can create, edit, or delete purchases.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Statistics Cards */}
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalPurchases}</div>
                <div className="text-gray-600">Total Purchases</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedPurchases}</div>
                <div className="text-gray-600">Completed</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{pendingPurchases}</div>
                <div className="text-gray-600">Pending</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${totalAmount.toFixed(2)}</div>
                <div className="text-gray-600">Total Value</div>
              </div>
            </Card>
          </Col>
        </Row>

        <div className="flex justify-between items-center">
          <Space>
            <Search
              placeholder="Search purchases..."
              allowClear
              style={{ width: 300 }}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchPurchases}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>

          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddPurchase}
            >
              Add Purchase
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPurchases}
        rowKey="id"
        loading={loading}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          total: filteredPurchases.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} purchases`,
        }}
      />

      {isAdmin && (
        <Drawer
          title={editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}
          size="large"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
        >
          <PurchaseForm
            initialValues={editingPurchase}
            vendors={vendors.map(v => ({ id: v.id as number, name: v.name as string, company_name: v.company_name as string }))}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerVisible(false)}
          />
        </Drawer>
      )}
    </div>
  );
}