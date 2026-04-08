"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, UserCheck, UserX } from "lucide-react";

interface Member {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembers(data.members || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleToggleActive(member: Member) {
    if (member.role === "admin") return;
    const action = member.is_active ? "비활성화" : "활성화";
    if (!confirm(`${member.name}님을 ${action}하시겠습니까?`)) return;

    if (member.is_active) {
      await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    }
    fetchMembers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">기사 관리</h2>
        <Link href="/members/new" className="btn btn-primary btn-sm gap-2">
          <Plus size={16} />
          기사 등록
        </Link>
      </div>

      <div className="bg-base-100 rounded-lg border border-base-300 overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>연락처</th>
              <th>역할</th>
              <th>상태</th>
              <th>등록일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-base-content/50">
                  등록된 멤버가 없습니다
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover">
                  <td className="font-medium">{member.name}</td>
                  <td className="text-sm">{member.email}</td>
                  <td className="text-sm">{member.phone || "-"}</td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        member.role === "admin" ? "badge-primary" : "badge-ghost"
                      }`}
                    >
                      {member.role === "admin" ? "관리자" : "기사"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        member.is_active ? "badge-success" : "badge-error"
                      }`}
                    >
                      {member.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="text-sm">
                    {new Date(member.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td>
                    {member.role !== "admin" && (
                      <div className="flex gap-1">
                        <Link
                          href={`/members/${member.id}/edit`}
                          className="btn btn-ghost btn-xs"
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleToggleActive(member)}
                          className={`btn btn-ghost btn-xs ${
                            member.is_active ? "text-error" : "text-success"
                          }`}
                        >
                          {member.is_active ? (
                            <UserX size={14} />
                          ) : (
                            <UserCheck size={14} />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
