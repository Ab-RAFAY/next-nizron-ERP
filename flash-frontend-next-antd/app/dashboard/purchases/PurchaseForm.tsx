'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Row, Col, Select, DatePicker, InputNumber, message } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Vendor {
  id: number;
  name: string;
  company_name?: string;
}

interface PurchaseFormProps {
  initialValues?: Record<string, unknown> | null;
  vendors: Vendor[];
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}

export default function PurchaseForm({ initialValues, vendors, onSubmit, onCancel }: PurchaseFormProps) {
  const [form] = Form.useForm();

  const handleSubmit = (values: Record<string, unknown>) => {
    // Convert dayjs objects to ISO strings for API
    const submitValues = { ...values };
    if (values.date && dayjs.isDayjs(values.date)) {
      submitValues.date = (values.date as any).toISOString();
    }
    if (values.delivery_date && dayjs.isDayjs(values.delivery_date)) {
      submitValues.delivery_date = (values.delivery_date as any).toISOString();
    }
    onSubmit(submitValues);
  };

  // Prepare initial values with proper date formatting
  const processedInitialValues = initialValues ? {
    ...initialValues,
    date: initialValues.date ? dayjs(initialValues.date as string) : dayjs(),
    delivery_date: initialValues.delivery_date ? dayjs(initialValues.delivery_date as string) : null,
  } : {
    status: 'pending',
    date: dayjs(),
  };

  const generatePurchaseOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PO-${timestamp}-${randomNum}`;
  };

  useEffect(() => {
    if (!initialValues) {
      // Generate a purchase order number for new purchases
      form.setFieldsValue({
        purchase_order: generatePurchaseOrderNumber(),
      });
    }
  }, [form, initialValues]);

  const categories = [
    'Office Supplies',
    'Equipment',
    'Raw Materials',
    'Services',
    'Software',
    'Hardware',
    'Maintenance',
    'Transportation',
    'Utilities',
    'Other'
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={processedInitialValues}
      onFinish={handleSubmit}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="purchase_order"
            label="Purchase Order Number"
            rules={[
              { required: true, message: 'Please enter purchase order number' },
              { max: 50, message: 'Purchase order cannot exceed 50 characters' }
            ]}
          >
            <Input placeholder="Enter purchase order number" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="vendor_id"
            label="Vendor"
            rules={[{ required: true, message: 'Please select a vendor' }]}
          >
            <Select placeholder="Select vendor" showSearch>
              {vendors.map(vendor => (
                <Option key={vendor.id} value={vendor.id}>
                  {vendor.name} {vendor.company_name ? `(${vendor.company_name})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="date"
            label="Purchase Date"
            rules={[{ required: true, message: 'Please select purchase date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="amount"
            label="Total Amount"
            rules={[
              { required: true, message: 'Please enter total amount' },
              { type: 'number', min: 0, message: 'Amount must be greater than 0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter total amount"
              prefix="$"
              min={0}
              step={0.01}
              precision={2}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select purchase category">
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="payment_terms"
            label="Payment Terms"
          >
            <Select placeholder="Select payment terms">
              <Option value="immediate">Immediate</Option>
              <Option value="net_15">Net 15 days</Option>
              <Option value="net_30">Net 30 days</Option>
              <Option value="net_60">Net 60 days</Option>
              <Option value="net_90">Net 90 days</Option>
              <Option value="cod">Cash on Delivery</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="priority"
            label="Priority"
          >
            <Select placeholder="Select priority">
              <Option value="low">Low</Option>
              <Option value="normal">Normal</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="delivery_date"
            label="Expected Delivery Date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="reference_number"
            label="Reference Number"
          >
            <Input placeholder="Enter reference number" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="delivery_address"
        label="Delivery Address"
        rules={[
          { max: 500, message: 'Delivery address cannot exceed 500 characters' }
        ]}
      >
        <TextArea 
          rows={3} 
          placeholder="Enter delivery address" 
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { max: 1000, message: 'Description cannot exceed 1000 characters' }
        ]}
      >
        <TextArea 
          rows={4} 
          placeholder="Enter purchase description and details" 
        />
      </Form.Item>

      <Form.Item
        name="notes"
        label="Internal Notes"
        rules={[
          { max: 1000, message: 'Notes cannot exceed 1000 characters' }
        ]}
      >
        <TextArea 
          rows={3} 
          placeholder="Enter any internal notes about this purchase" 
        />
      </Form.Item>

      <div className="flex justify-end space-x-2">
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button type="primary" htmlType="submit">
          {initialValues ? 'Update Purchase' : 'Create Purchase'}
        </Button>
      </div>
    </Form>
  );
}