"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { Spinner } from "@/components/ui/spinner";

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
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);

  const loading = !certificates;

  useEffect(() => {
    let ignore = false;

    async function fetchCertificates() {
      const res = await fetch("/api/certificates");
      const data = await res.json();
      if (!ignore) {
        setCertificates(data.certificates || []);
      }
    }

    fetchCertificates();

    return () => {
      ignore = true;
    };
  }, []);

  function getFacilityLabel(typeId: string) {
    return FACILITY_TYPES.find((ft) => ft.id === typeId)?.label || typeId;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">증명서</h2>
      </div>

      <div className="bg-base-100 rounded-lg border border-base-300 overflow-x-auto">
        <table className="data-table">
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
                  <Spinner size="md" />
                </td>
              </tr>
            ) : certificates?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-base-content/50">
                  발급된 증명서가 없습니다
                </td>
              </tr>
            ) : (
              certificates?.map((cert) => {
                const visit = cert.visits as unknown as Certificate["visits"];
                const client = visit?.clients as unknown as { id: string; name: string; facility_type: string } | null;
                return (
                  <tr key={cert.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-primary" />
                        <span className="font-mono text-base">{cert.certificate_number}</span>
                      </div>
                    </td>
                    <td>
                      {client ? (
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-primary hover:underline !text-base"
                        >
                          {client.name}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="text-base">
                      {client ? getFacilityLabel(client.facility_type) : "-"}
                    </td>
                    <td className="text-base">{visit?.scheduled_date || "-"}</td>
                    <td className="text-base">
                      {new Date(cert.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td>
                      {cert.pdf_url && (
                        <a
                          href={cert.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-base font-medium hover:bg-base-200 transition-colors cursor-pointer"
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
