'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Row, Col, Select, message } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

interface VendorFormProps {
  initialValues?: Record<string, unknown> | null;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}

export default function VendorForm({ initialValues, onSubmit, onCancel }: VendorFormProps) {
  const [form] = Form.useForm();

  const handleSubmit = (values: Record<string, unknown>) => {
    onSubmit(values);
  };

  const categories = [
    'Equipment Supplier',
    'Service Provider',
    'Raw Materials',
    'Technology',
    'Construction',
    'Transport',
    'Consulting',
    'Other'
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues || { status: 'active' }}
      onFinish={handleSubmit}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="vendor_id"
            label="Vendor ID"
            rules={[
              { required: true, message: 'Please enter vendor ID' },
              { max: 50, message: 'Vendor ID cannot exceed 50 characters' }
            ]}
          >
            <Input placeholder="Enter vendor ID" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="Vendor Name"
            rules={[
              { required: true, message: 'Please enter vendor name' },
              { max: 100, message: 'Name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="Enter vendor name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="company_name"
            label="Company Name"
            rules={[
              { max: 100, message: 'Company name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Please enter a valid email' },
              { max: 100, message: 'Email cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { max: 20, message: 'Phone cannot exceed 20 characters' }
            ]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select vendor category">
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="website"
            label="Website"
            rules={[
              { type: 'url', message: 'Please enter a valid URL' },
              { max: 200, message: 'Website cannot exceed 200 characters' }
            ]}
          >
            <Input placeholder="Enter website URL" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="address"
        label="Address"
        rules={[
          { max: 500, message: 'Address cannot exceed 500 characters' }
        ]}
      >
        <TextArea 
          rows={3} 
          placeholder="Enter vendor address" 
        />
      </Form.Item>

      <Form.Item
        name="notes"
        label="Notes"
        rules={[
          { max: 1000, message: 'Notes cannot exceed 1000 characters' }
        ]}
      >
        <TextArea 
          rows={4} 
          placeholder="Enter any additional notes about the vendor" 
        />
      </Form.Item>

      <div className="flex justify-end space-x-2">
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit">
          {initialValues ? 'Update Vendor' : 'Create Vendor'}
        </Button>
      </div>
    </Form>
  );
}