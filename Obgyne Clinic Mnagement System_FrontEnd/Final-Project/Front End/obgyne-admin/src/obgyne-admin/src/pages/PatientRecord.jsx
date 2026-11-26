import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { fetchPatientRecord, updatePatientRecord } from '../services/patients'
import { formatDate, valueOrDash, initials } from '../utils/format'
import { linkProps } from '../router'
import './Schedule.css'
import './Patients.css'

function Fact({ label, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{valueOrDash(children)}</dd>
    </>
  )
}

function Field({ label, name, value, onChange, type = 'text', multiline = false, required = false, maxLength }) {
  const common = {
    id: `edit-${name}`,
    name,
    value: value ?? '',
    onChange: (event) => onChange(name, event.target.value),
    required,
    maxLength,
  }
  return (
    <label className="record-field">
      <span>{label}{required ? ' *' : ''}</span>
      {multiline
        ? <textarea {...common} rows="3" />
        : <input {...common} type={type} />}
    </label>
  )
}

function makeDraft(data) {
  const p = data.patient || {}
  const h = data.medicalHistory || {}
  return {
    patient: {
      fullName: p.fullName || '',
      birthDate: p.birthDate || '',
      civilStatus: p.civilStatus || '',
      contactNumber: p.contactNumber || '',
      email: p.email || '',
      address: p.address || '',
      occupation: p.occupation || '',
      emergencyContactName: p.emergencyContactName || '',
      emergencyContactNumber: p.emergencyContactNumber || '',
    },
    medicalHistory: {
      bloodType: h.bloodType || '',
      allergies: h.allergies || '',
      chronicConditions: h.chronicConditions || '',
      pastSurgeries: h.pastSurgeries || '',
      currentMedications: h.currentMedications || '',
      familyHistory: h.familyHistory || '',
      gravida: h.gravida ?? '',
      para: h.para ?? '',
      lastMenstrualPeriod: h.lastMenstrualPeriod || '',
      notes: h.notes || '',
    },
  }
}

export default function PatientRecord({ patientRef, session, onLogout }) {
  const { user, token } = session
  const [reload, setReload] = useState(0)
  const [state, setState] = useState({ key: '', data: null, error: '', code: '' })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const requestKey = `${patientRef}|${reload}`
  const loading = state.key !== requestKey

  useEffect(() => {
    let ignore = false
    fetchPatientRecord({ id: patientRef, token })
      .then((data) => {
        if (!ignore) {
          setState({ key: requestKey, data, error: '', code: '' })
          setDraft(makeDraft(data))
          setEditing(false)
          setSaveError('')
        }
      })
      .catch((err) => {
        if (ignore) return
        if (err.code === 'unauthorized') {
          onLogout()
          return
        }
        setState({ key: requestKey, data: null, error: err.message, code: err.code })
      })
    return () => { ignore = true }
  }, [patientRef, token, requestKey, onLogout])

  const data = loading ? null : state.data
  const notFound = !loading && (state.code === 'not_found' || state.code === 'invalid')
  const failed = !loading && !!state.error && !notFound
  const p = data?.patient
  const h = data?.medicalHistory
  const checkups = data?.checkups ?? []
  const auditHistory = data?.auditHistory ?? []

  function changeField(section, name, value) {
    setDraft((current) => ({
      ...current,
      [section]: { ...current[section], [name]: value },
    }))
  }

  function cancelEdit() {
    setDraft(makeDraft(data))
    setEditing(false)
    setSaveError('')
  }

  async function saveChanges(event) {
    event.preventDefault()
    setSaveError('')
    setSaveMessage('')
    if (!draft.patient.fullName.trim() || !draft.patient.birthDate) {
      setSaveError('Patient name and date of birth are required.')
      return
    }
    if (draft.patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.patient.email)) {
      setSaveError('Please enter a valid email address.')
      return
    }
    if (!window.confirm('Save these changes to the patient record?')) return

    setSaving(true)
    try {
      const result = await updatePatientRecord({
        id: patientRef,
        token,
        patient: draft.patient,
        medicalHistory: draft.medicalHistory,
      })
      setSaveMessage(result.message || 'Patient record updated successfully.')
      setEditing(false)
      setReload((n) => n + 1)
    } catch (err) {
      if (err.code === 'unauthorized') {
        onLogout()
        return
      }
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sched">
      <title>{p ? `${p.fullName} | Patient Record` : 'Patient Record'} | Moral-Macatangay OB-GYN Clinic</title>
      <AppHeader user={user} onLogout={onLogout} current="patients" />

      <main className="sched-main record">
        <a className="back-link" {...linkProps('/patients')}>‹ Back to patient list</a>

        {loading && (
          <div className="skeletons" role="status" aria-label="Loading patient record">
            <div className="skeleton tall" />
            <div className="skeleton tall" />
            <div className="skeleton tall" />
          </div>
        )}

        {notFound && (
          <div className="sched-list empty" role="alert">
            <h2>Patient record not found</h2>
            <p>We couldn’t find a record for “{patientRef}”. The patient ID may be wrong or the record may have been removed.</p>
            <a className="btn-link" {...linkProps('/patients')}>Go to patient list</a>
          </div>
        )}

        {failed && (
          <div className="alert" role="alert">
            <p>{state.error}</p>
            <button type="button" onClick={() => setReload((n) => n + 1)}>Try again</button>
          </div>
        )}

        {p && draft && (
          <>
            <div className="rec-head">
              <div className="rec-avatar" aria-hidden="true">{initials(p.fullName)}</div>
              <div className="rec-heading-copy">
                <h1>{p.fullName}</h1>
                <p className="rec-meta">
                  <span className="code">{p.patientCode}</span>
                  <span>Age {p.age}</span>
                  <span>Born {formatDate(p.birthDate)}</span>
                </p>
              </div>
              {!editing && (
                <button className="record-primary-action" type="button" onClick={() => { setDraft(makeDraft(data)); setEditing(true); setSaveMessage('') }}>
                  Edit patient record
                </button>
              )}
            </div>
            <p className="confidential">Confidential health record. Do not share outside the clinic.</p>
            {saveMessage && <p className="record-success" role="status">{saveMessage}</p>}
            {saveError && <p className="record-error" role="alert">{saveError}</p>}

            {editing && (
              <form className="record-edit-form" onSubmit={saveChanges}>
                <div className="record-edit-heading">
                  <div>
                    <h2>Edit patient record</h2>
                    <p>Update personal details and the current medical history. Previous check-ups remain as consultation history.</p>
                  </div>
                  <span className="required-note">* Required</span>
                </div>

                <section className="rec-card">
                  <h2>Personal details</h2>
                  <div className="record-form-grid">
                    <Field label="Full name" name="fullName" value={draft.patient.fullName} onChange={(n,v) => changeField('patient',n,v)} required maxLength={150} />
                    <Field label="Date of birth" name="birthDate" type="date" value={draft.patient.birthDate} onChange={(n,v) => changeField('patient',n,v)} required />
                    <label className="record-field">
                      <span>Civil status</span>
                      <select value={draft.patient.civilStatus} onChange={(e) => changeField('patient','civilStatus',e.target.value)}>
                        <option value="">Select civil status</option>
                        {draft.patient.civilStatus && !['Single','Married','Widowed','Separated'].includes(draft.patient.civilStatus) && <option>{draft.patient.civilStatus}</option>}
                        <option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option>
                      </select>
                    </label>
                    <Field label="Contact number" name="contactNumber" value={draft.patient.contactNumber} onChange={(n,v) => changeField('patient',n,v)} maxLength={40} />
                    <Field label="Email" name="email" type="email" value={draft.patient.email} onChange={(n,v) => changeField('patient',n,v)} maxLength={100} />
                    <Field label="Occupation" name="occupation" value={draft.patient.occupation} onChange={(n,v) => changeField('patient',n,v)} maxLength={100} />
                    <Field label="Address" name="address" value={draft.patient.address} onChange={(n,v) => changeField('patient',n,v)} maxLength={255} />
                    <Field label="Emergency contact name" name="emergencyContactName" value={draft.patient.emergencyContactName} onChange={(n,v) => changeField('patient',n,v)} maxLength={150} />
                    <Field label="Emergency contact number" name="emergencyContactNumber" value={draft.patient.emergencyContactNumber} onChange={(n,v) => changeField('patient',n,v)} maxLength={40} />
                  </div>
                </section>

                <section className="rec-card">
                  <h2>Medical history</h2>
                  <div className="record-form-grid">
                    <label className="record-field">
                      <span>Blood type</span>
                      <select value={draft.medicalHistory.bloodType} onChange={(e) => changeField('medicalHistory','bloodType',e.target.value)}>
                        <option value="">Not recorded</option>
                        {draft.medicalHistory.bloodType && !['A+','A-','B+','B-','AB+','AB-','O+','O-'].includes(draft.medicalHistory.bloodType) && <option>{draft.medicalHistory.bloodType}</option>}
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((type) => <option key={type}>{type}</option>)}
                      </select>
                    </label>
                    <Field label="Gravida (pregnancies)" name="gravida" type="number" value={draft.medicalHistory.gravida} onChange={(n,v) => changeField('medicalHistory',n,v)} />
                    <Field label="Para (deliveries)" name="para" type="number" value={draft.medicalHistory.para} onChange={(n,v) => changeField('medicalHistory',n,v)} />
                    <Field label="Last menstrual period" name="lastMenstrualPeriod" type="date" value={draft.medicalHistory.lastMenstrualPeriod} onChange={(n,v) => changeField('medicalHistory',n,v)} />
                    <Field label="Allergies" name="allergies" value={draft.medicalHistory.allergies} onChange={(n,v) => changeField('medicalHistory',n,v)} multiline maxLength={5000} />
                    <Field label="Chronic conditions" name="chronicConditions" value={draft.medicalHistory.chronicConditions} onChange={(n,v) => changeField('medicalHistory',n,v)} multiline maxLength={5000} />
                    <Field label="Past surgeries" name="pastSurgeries" value={draft.medicalHistory.pastSurgeries} onChange={(n,v) => changeField('medicalHistory',n,v)} multiline maxLength={5000} />
                    <Field label="Current medications" name="currentMedications" value={draft.medicalHistory.currentMedications} onChange={(n,v) => changeField('medicalHistory',n,v)} multiline maxLength={5000} />
                    <Field label="Family history" name="familyHistory" value={draft.medicalHistory.familyHistory} onChange={(n,v) => changeField('medicalHistory',n,v)} multiline maxLength={5000} />
                    <Field label="Notes" name="notes" value={draft.medicalHistory.notes} onChange={(n,v) => changeField('medicalHistory',n,v)} multiline maxLength={10000} />
                  </div>
                </section>

                <div className="record-form-actions">
                  <button className="record-secondary-action" type="button" onClick={cancelEdit} disabled={saving}>Cancel</button>
                  <button className="record-primary-action" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                </div>
              </form>
            )}

            {!editing && (
              <div className="rec-grid">
                <section className="rec-card" aria-labelledby="sec-personal">
                  <h2 id="sec-personal">Personal details</h2>
                  <dl className="facts">
                    <Fact label="Civil status">{p.civilStatus}</Fact>
                    <Fact label="Contact">{p.contactNumber}</Fact>
                    <Fact label="Email">{p.email}</Fact>
                    <Fact label="Address">{p.address}</Fact>
                    <Fact label="Occupation">{p.occupation}</Fact>
                    <Fact label="Emergency contact">{p.emergencyContactName ? `${p.emergencyContactName}${p.emergencyContactNumber ? ` (${p.emergencyContactNumber})` : ''}` : null}</Fact>
                  </dl>
                </section>

                <section className="rec-card" aria-labelledby="sec-history">
                  <h2 id="sec-history">Medical history</h2>
                  {h ? (
                    <dl className="facts">
                      <Fact label="Blood type">{h.bloodType}</Fact>
                      <Fact label="Allergies">{h.allergies}</Fact>
                      <Fact label="Conditions">{h.chronicConditions}</Fact>
                      <Fact label="Past surgeries">{h.pastSurgeries}</Fact>
                      <Fact label="Medications">{h.currentMedications}</Fact>
                      <Fact label="Family history">{h.familyHistory}</Fact>
                      <Fact label="Pregnancies">{h.gravida === null && h.para === null ? null : `G${h.gravida ?? '?'} P${h.para ?? '?'}`}</Fact>
                      <Fact label="Last period">{h.lastMenstrualPeriod ? formatDate(h.lastMenstrualPeriod) : null}</Fact>
                      <Fact label="Notes">{h.notes}</Fact>
                    </dl>
                  ) : <p className="muted">No medical history has been recorded for this patient yet.</p>}
                </section>

                <section className="rec-card wide" aria-labelledby="sec-checkups">
                  <h2 id="sec-checkups">Previous check-ups <span className="pill">{checkups.length}</span></h2>
                  {checkups.length === 0 ? <p className="muted">This patient has no previous check-ups.</p> : (
                    <ol className="timeline">
                      {checkups.map((c) => (
                        <li key={c.id}>
                          <div className="tl-head"><strong>{c.service}</strong><time dateTime={c.date}>{formatDate(c.date)}</time></div>
                          <div className="chips">
                            {c.weightKg !== null && <span>Weight {c.weightKg} kg</span>}
                            {c.bloodPressure && <span>BP {c.bloodPressure}</span>}
                            {c.gestationalAgeWeeks !== null && <span>{c.gestationalAgeWeeks} weeks AOG</span>}
                          </div>
                          <dl className="facts compact">
                            <Fact label="Findings">{c.findings}</Fact>
                            <Fact label="Treatment">{c.treatment}</Fact>
                            <Fact label="Next visit">{c.nextVisitDate ? formatDate(c.nextVisitDate) : null}</Fact>
                            <Fact label="Attended by">{c.attendedBy}</Fact>
                          </dl>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                <section className="rec-card wide" aria-labelledby="sec-audit">
                  <h2 id="sec-audit">Record change history <span className="pill">{auditHistory.length}</span></h2>
                  {auditHistory.length === 0 ? <p className="muted">No edits have been recorded yet.</p> : (
                    <ol className="audit-list">
                      {auditHistory.map((entry) => (
                        <li key={entry.id}>
                          <div className="audit-heading">
                            <strong>{entry.editorName}</strong>
                            <time>{entry.changedAt}</time>
                          </div>
                          <ul>
                            {Object.entries(entry.changes || {}).map(([field, change]) => (
                              <li key={field}><span>{field.replace('.', ' · ')}</span>: {String(change.from ?? '—')} → {String(change.to ?? '—')}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
