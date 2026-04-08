"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";

interface Certificate {
  id: string;
  certificate_number: string;
  pdf_url: string | null;
  created_at: string;
  visits: {
    id: string;
    scheduled_date: string;
    method: string | null;
    clients: {
      id: string;
      name: string;
      facility_type: string;
    } | null;
  } | null;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCertificates = useCallback(async () => {
    const res = await fetch("/api/certificates");
    const data = await res.json();
    setCertificates(data.certificates || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  function getFacilityLabel(typeId: string) {
    return FACILITY_TYPES.find((ft) => ft.id === typeId)?.label || typeId;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">증명서</h2>
      </div>

      <div className="bg-base-100 rounded-lg border border-base-300 overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>증명서 번호</th>
              <th>시설명</th>
              <th>시설 유형</th>
              <th>소독일</th>
              <th>발급일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : certificates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-base-content/50">
                  발급된 증명서가 없습니다
                </td>
              </tr>
            ) : (
              certificates.map((cert) => {
                const visit = cert.visits as unknown as Certificate["visits"];
                const client = visit?.clients as unknown as { id: string; name: string; facility_type: string } | null;
                return (
                  <tr key={cert.id} className="hover">
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-primary" />
                        <span className="font-mono text-sm">{cert.certificate_number}</span>
                      </div>
                    </td>
                    <td>
                      {client ? (
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {client.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="text-sm">
                      {client ? getFacilityLabel(client.facility_type) : "-"}
                    </td>
                    <td className="text-sm">{visit?.scheduled_date || "-"}</td>
                    <td className="text-sm">
                      {new Date(cert.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td>
                      {cert.pdf_url && (
                        <a
                          href={cert.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-xs gap-1"
                        >
                          <Download size={12} /> PDF
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
