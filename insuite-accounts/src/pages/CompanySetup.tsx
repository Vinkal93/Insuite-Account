import { useState, useEffect } from 'react';
import db from '../db/database';
import type { Company } from '../types';

type SetupStep = 'basic' | 'address' | 'tax' | 'bank' | 'branding';

const steps: { key: SetupStep; label: string; icon: string }[] = [
    { key: 'basic', label: 'Basic Info', icon: '📋' },
    { key: 'address', label: 'Address', icon: '📍' },
    { key: 'tax', label: 'Tax Details', icon: '🧾' },
    { key: 'bank', label: 'Bank Details', icon: '🏦' },
    { key: 'branding', label: 'Branding', icon: '🎨' },
];

const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

export default function CompanySetup() {
    const [currentStep, setCurrentStep] = useState<SetupStep>('basic');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Company>>({
        name: '',
        gstin: '',
        pan: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        bankName: '',
        bankAccount: '',
        bankIfsc: '',
        financialYearStart: '04',
        logo: '',
    });

    useEffect(() => {
        loadCompany();
    }, []);

    const loadCompany = async () => {
        const company = await db.company.toCollection().first();
        if (company) {
            setFormData(company);
        }
        setLoading(false);
    };

    const updateField = (field: keyof Company, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const saveCompany = async () => {
        setSaving(true);
        try {
            const existingCompany = await db.company.toCollection().first();
            const now = new Date();

            if (existingCompany?.id) {
                await db.company.update(existingCompany.id, {
                    ...formData,
                    updatedAt: now,
                });
            } else {
                await db.company.add({
                    ...formData as Company,
                    createdAt: now,
                    updatedAt: now,
                });
            }

            // Show success
            alert('Company details saved successfully!');
        } catch (error) {
            console.error('Error saving company:', error);
            alert('Failed to save company details');
        } finally {
            setSaving(false);
        }
    };

    const goToStep = (step: SetupStep) => setCurrentStep(step);

    const nextStep = () => {
        const currentIndex = steps.findIndex(s => s.key === currentStep);
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1].key);
        }
    };

    const prevStep = () => {
        const currentIndex = steps.findIndex(s => s.key === currentStep);
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1].key);
        }
    };

    const currentStepIndex = steps.findIndex(s => s.key === currentStep);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="text-title-large text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 'var(--md-sys-spacing-xl)' }}>
                <h1 className="text-headline-large" style={{ marginBottom: 'var(--md-sys-spacing-xs)' }}>
                    🏢 Company Setup
                </h1>
                <p className="text-body-large text-muted">
                    Configure your business details for invoices, GST, and reports
                </p>
            </div>

            {/* Progress Steps */}
            <div className="card card-gradient" style={{ marginBottom: 'var(--md-sys-spacing-xl)', padding: 'var(--md-sys-spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {steps.map((step, index) => (
                        <div
                            key={step.key}
                            onClick={() => goToStep(step.key)}
                            className={`setup-step ${currentStep === step.key ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
                            style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}
                        >
                            <div className="step-number" style={{ margin: '0 auto' }}>
                                {index < currentStepIndex ? '✓' : step.icon}
                            </div>
                            <div className="text-label-medium" style={{ marginTop: 'var(--md-sys-spacing-xs)' }}>
                                {step.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Content */}
            <div className="card animate-slide-up" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                {currentStep === 'basic' && (
                    <div>
                        <h2 className="text-headline-medium" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                            📋 Basic Information
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--md-sys-spacing-md)' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label form-label-required">Company / Business Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter your business name"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Business Type</label>
                                <select className="form-input form-select" defaultValue="proprietorship">
                                    <option value="proprietorship">Proprietorship</option>
                                    <option value="partnership">Partnership</option>
                                    <option value="llp">LLP</option>
                                    <option value="pvt_ltd">Private Limited</option>
                                    <option value="public_ltd">Public Limited</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Industry</label>
                                <select className="form-input form-select" defaultValue="retail">
                                    <option value="retail">Retail</option>
                                    <option value="wholesale">Wholesale</option>
                                    <option value="manufacturing">Manufacturing</option>
                                    <option value="services">Services</option>
                                    <option value="it">IT / Software</option>
                                    <option value="education">Education</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="+91 XXXXX XXXXX"
                                    value={formData.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="business@example.com"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 'address' && (
                    <div>
                        <h2 className="text-headline-medium" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                            📍 Business Address
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--md-sys-spacing-md)' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label form-label-required">Street Address</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Shop/Office No., Building Name, Street, Landmark"
                                    value={formData.address}
                                    onChange={(e) => updateField('address', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label form-label-required">City</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter city"
                                    value={formData.city}
                                    onChange={(e) => updateField('city', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label form-label-required">State</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.state}
                                    onChange={(e) => updateField('state', e.target.value)}
                                >
                                    <option value="">Select State</option>
                                    {indianStates.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label form-label-required">PIN Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="6-digit PIN"
                                    maxLength={6}
                                    value={formData.pincode}
                                    onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Country</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value="India"
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 'tax' && (
                    <div>
                        <h2 className="text-headline-medium" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                            🧾 Tax & Compliance Details
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--md-sys-spacing-md)' }}>
                            <div className="form-group">
                                <label className="form-label">GSTIN (GST Number)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="22XXXXX1234X1Z5"
                                    maxLength={15}
                                    value={formData.gstin}
                                    onChange={(e) => updateField('gstin', e.target.value.toUpperCase())}
                                />
                                <small className="text-label-medium text-muted">15-character GST Identification Number</small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">PAN Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                    value={formData.pan}
                                    onChange={(e) => updateField('pan', e.target.value.toUpperCase())}
                                />
                                <small className="text-label-medium text-muted">10-character Permanent Account Number</small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Financial Year Start</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.financialYearStart}
                                    onChange={(e) => updateField('financialYearStart', e.target.value)}
                                >
                                    <option value="04">April (Standard)</option>
                                    <option value="01">January</option>
                                    <option value="07">July</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">GST Registration Type</label>
                                <select className="form-input form-select" defaultValue="regular">
                                    <option value="regular">Regular</option>
                                    <option value="composition">Composition</option>
                                    <option value="unregistered">Unregistered</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">TAN Number (if applicable)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="ABCD12345E"
                                    maxLength={10}
                                />
                                <small className="text-label-medium text-muted">Tax Deduction Account Number for TDS</small>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 'bank' && (
                    <div>
                        <h2 className="text-headline-medium" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                            🏦 Bank Account Details
                        </h2>
                        <p className="text-body-medium text-muted" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                            These details will appear on your invoices for payment collection
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--md-sys-spacing-md)' }}>
                            <div className="form-group">
                                <label className="form-label">Bank Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., State Bank of India"
                                    value={formData.bankName}
                                    onChange={(e) => updateField('bankName', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Account Type</label>
                                <select className="form-input form-select" defaultValue="current">
                                    <option value="current">Current Account</option>
                                    <option value="savings">Savings Account</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Account Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter account number"
                                    value={formData.bankAccount}
                                    onChange={(e) => updateField('bankAccount', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">IFSC Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., SBIN0001234"
                                    maxLength={11}
                                    value={formData.bankIfsc}
                                    onChange={(e) => updateField('bankIfsc', e.target.value.toUpperCase())}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Account Holder Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Name as per bank records"
                                    defaultValue={formData.name}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">UPI ID (optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="yourname@upi"
                                />
                                <small className="text-label-medium text-muted">UPI ID for quick payments</small>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 'branding' && (
                    <div>
                        <h2 className="text-headline-medium" style={{ marginBottom: 'var(--md-sys-spacing-lg)' }}>
                            🎨 Branding & Customization
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--md-sys-spacing-xl)' }}>
                            <div>
                                <label className="form-label">Company Logo</label>
                                <div className="logo-upload">
                                    <span style={{ fontSize: '2rem' }}>📷</span>
                                    <span className="text-label-medium text-muted">Click to upload</span>
                                </div>
                                <small className="text-label-medium text-muted" style={{ display: 'block', marginTop: 'var(--md-sys-spacing-sm)' }}>
                                    PNG, JPG up to 2MB. Recommended: 200x200px
                                </small>
                            </div>
                            <div>
                                <div className="form-group">
                                    <label className="form-label">Invoice Header Text</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Custom header for invoices"
                                        defaultValue={formData.name}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Invoice Footer / Terms</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder="Terms and conditions, thank you message, etc."
                                        defaultValue="Thank you for your business! Payment is due within 30 days."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Signature</label>
                                    <div style={{
                                        border: '2px dashed var(--md-sys-color-outline)',
                                        borderRadius: 'var(--md-sys-shape-corner-md)',
                                        padding: 'var(--md-sys-spacing-lg)',
                                        textAlign: 'center'
                                    }}>
                                        <span className="text-body-medium text-muted">Click to upload digital signature</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                    className="btn btn-outlined"
                    onClick={prevStep}
                    disabled={currentStepIndex === 0}
                    style={{ opacity: currentStepIndex === 0 ? 0.5 : 1 }}
                >
                    ← Previous
                </button>
                <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-md)' }}>
                    <button className="btn btn-text" onClick={saveCompany} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Draft'}
                    </button>
                    {currentStepIndex < steps.length - 1 ? (
                        <button className="btn btn-filled" onClick={nextStep}>
                            Next →
                        </button>
                    ) : (
                        <button className="btn btn-success" onClick={saveCompany} disabled={saving}>
                            {saving ? 'Saving...' : '✓ Complete Setup'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
