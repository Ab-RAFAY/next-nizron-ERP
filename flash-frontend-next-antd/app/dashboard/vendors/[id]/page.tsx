'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card, Button, Space, Table, Drawer, Form, Input,
  App, Popconfirm, Tag, Spin, Tabs, Row, Col,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  ShopOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined,
  GlobalOutlined, UserOutlined, FileDoneOutlined,
} from '@ant-design/icons';
import { vendorApi } from '@/lib/api';
import VendorForm from '../VendorForm';

const { TextArea } = Input;
const { TabPane } = Tabs;

const Field = ({ label, value }: { label: string; value: unknown }) => (
  <div className="field mb-4">
    <div className="field-label text-gray-600 font-medium"><strong>{label}:</strong></div>
    <div className="field-value text-gray-900 mt-1">{String(value || '-')}</div>
  </div>
);

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { message } = App.useApp();
  const vendorId = parseInt(params.id as string);

  const [vendor, setVendor] = useState<Record<string, unknown> | null>(null);
  const [contacts, setContacts] = useState<Array<Record<string, unknown>>>([]);
  const [purchases, setPurchases] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [contactDrawerVisible, setContactDrawerVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Record<string, unknown> | null>(null);
  const [contactForm] = Form.useForm();

  const fetchVendor = async () => {
    setLoading(true);
    const response = await vendorApi.getOne(vendorId);
    setLoading(false);
    if (response.error) {
      message.error(response.error);
      return;
    }
    setVendor((response.data as any)?.vendor || (response.data as any) || null);
  };

  const fetchContacts = async () => {
    const response = await vendorApi.getContacts(vendorId);
    if (!response.error) {
      setContacts((response.data as any)?.contacts || (response.data as any) || []);
    }
  };

  const fetchPurchases = async () => {
    const response = await vendorApi.getPurchases(vendorId);
    if (!response.error) {
      setPurchases((response.data as any)?.purchases || (response.data as any) || []);
    }
  };

  useEffect(() => {
    fetchVendor();
    fetchContacts();
    fetchPurchases();
  }, [vendorId]);

  const handleEditVendor = async (values: Record<string, unknown>) => {
    const response = await vendorApi.update(vendorId, values);
    if (response.error) {
      message.error('Failed to update vendor: ' + response.error);
      return;
    }
    message.success('Vendor updated successfully');
    setEditDrawerVisible(false);
    fetchVendor();
  };

  const handleDeleteVendor = async () => {
    const response = await vendorApi.delete(vendorId);
    if (response.error) {
      message.error('Failed to delete vendor: ' + response.error);
      return;
    }
    message.success('Vendor deleted successfully');
    router.push('/dashboard/vendors');
  };

  // Contact management functions
  const handleAddContact = () => {
    setEditingContact(null);
    contactForm.resetFields();
    setContactDrawerVisible(true);
  };

  const handleEditContact = (contact: Record<string, unknown>) => {
    setEditingContact(contact);
    contactForm.setFieldsValue(contact);
    setContactDrawerVisible(true);
  };

  const handleContactSubmit = async (values: Record<string, unknown>) => {
    const response = editingContact
      ? await vendorApi.updateContact(vendorId, editingContact.id as number, values)
      : await vendorApi.createContact(vendorId, values);

    if (response.error) {
      message.error(`Failed to ${editingContact ? 'update' : 'create'} contact: ` + response.error);
      return;
    }
    message.success(`Contact ${editingContact ? 'updated' : 'created'} successfully`);
    setContactDrawerVisible(false);
    fetchContacts();
  };

  const handleDeleteContact = async (contactId: number) => {
    const response = await vendorApi.deleteContact(vendorId, contactId);
    if (response.error) {
      message.error('Failed to delete contact: ' + response.error);
      return;
    }
    message.success('Contact deleted successfully');
    fetchContacts();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2>Vendor not found</h2>
          <Button onClick={() => router.push('/dashboard/vendors')}>
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }

  const contactColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Position', dataIndex: 'position', key: 'position' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditContact(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this contact?"
            onConfirm={() => handleDeleteContact(record.id as number)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const purchaseColumns = [
    { title: 'Purchase Order', dataIndex: 'purchase_order', key: 'purchase_order' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', 
      render: (amount: number) => `$${amount?.toFixed(2) || '0.00'}` },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Record<string, unknown>) => (
        <Button
          type="link"
          onClick={() => router.push(`/dashboard/purchases/${record.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Space className="mb-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
          >
            Back
          </Button>
        </Space>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <ShopOutlined className="mr-2" />
            {String(vendor.name)}
          </h1>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => setEditDrawerVisible(true)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Are you sure you want to delete this vendor?"
              onConfirm={handleDeleteVendor}
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </div>

      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Vendor Information" className="mb-4">
                <Field label="Vendor ID" value={vendor.vendor_id} />
                <Field label="Name" value={vendor.name} />
                <Field label="Company Name" value={vendor.company_name} />
                <Field label="Category" value={vendor.category} />
                <Field label="Status" value={
                  <Tag color={vendor.status === 'active' ? 'green' : 'red'}>
                    {String(vendor.status).toUpperCase()}
                  </Tag>
                } />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Contact Information" className="mb-4">
                <Field label="Email" value={
                  vendor.email ? (
                    <a href={`mailto:${vendor.email}`} className="text-blue-600">
                      <MailOutlined className="mr-1" />
                      {String(vendor.email)}
                    </a>
                  ) : '-'
                } />
                <Field label="Phone" value={
                  vendor.phone ? (
                    <span>
                      <PhoneOutlined className="mr-1" />
                      {String(vendor.phone)}
                    </span>
                  ) : '-'
                } />
                <Field label="Website" value={
                  vendor.website ? (
                    <a href={String(vendor.website)} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                      <GlobalOutlined className="mr-1" />
                      {String(vendor.website)}
                    </a>
                  ) : '-'
                } />
                <Field label="Address" value={
                  vendor.address ? (
                    <span>
                      <EnvironmentOutlined className="mr-1" />
                      {String(vendor.address)}
                    </span>
                  ) : '-'
                } />
              </Card>
            </Col>
          </Row>

          {String(vendor.notes) && (
            <Card title="Notes" className="mb-4">
              <p>{String(vendor.notes)}</p>
            </Card>
          )}
        </TabPane>

        <TabPane tab="Contacts" key="contacts">
          <div className="mb-4">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddContact}
            >
              Add Contact
            </Button>
          </div>
          <Table
            columns={contactColumns}
            dataSource={contacts}
            rowKey="id"
            pagination={false}
          />
        </TabPane>

        <TabPane tab="Purchase History" key="purchases">
          <Table
            columns={purchaseColumns}
            dataSource={purchases}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} purchases`,
            }}
          />
        </TabPane>
      </Tabs>

      {/* Edit Vendor Drawer */}
      <Drawer
        title="Edit Vendor"
        size="large"
        onClose={() => setEditDrawerVisible(false)}
        open={editDrawerVisible}
      >
        <VendorForm
          initialValues={vendor}
          onSubmit={handleEditVendor}
          onCancel={() => setEditDrawerVisible(false)}
        />
      </Drawer>

      {/* Contact Form Drawer */}
      <Drawer
        title={editingContact ? 'Edit Contact' : 'Add New Contact'}
        size="default"
        onClose={() => setContactDrawerVisible(false)}
        open={contactDrawerVisible}
      >
        <Form
          form={contactForm}
          layout="vertical"
          onFinish={handleContactSubmit}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter contact name' }]}
          >
            <Input placeholder="Enter contact name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item
            name="position"
            label="Position"
          >
            <Input placeholder="Enter position/title" />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Enter any additional notes" />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setContactDrawerVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingContact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}