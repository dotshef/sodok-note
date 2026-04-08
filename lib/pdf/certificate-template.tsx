import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

Font.register({
  family: "NotoSansKR",
  fonts: [
    { src: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansKR",
    padding: 50,
    fontSize: 11,
    color: "#222",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 30,
  },
  certNumber: {
    fontSize: 10,
    color: "#666",
    textAlign: "right",
    marginBottom: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: "#333",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  rowLast: {
    flexDirection: "row",
  },
  labelCell: {
    width: "25%",
    padding: 10,
    backgroundColor: "#f5f5f5",
    fontWeight: 700,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  valueCell: {
    width: "75%",
    padding: 10,
  },
  halfLabel: {
    width: "25%",
    padding: 10,
    backgroundColor: "#f5f5f5",
    fontWeight: 700,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  halfValue: {
    width: "25%",
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  halfValueLast: {
    width: "25%",
    padding: 10,
  },
  notice: {
    marginTop: 30,
    fontSize: 10,
    color: "#666",
    lineHeight: 1.6,
    textAlign: "center",
  },
  footer: {
    marginTop: 40,
    textAlign: "center",
  },
  date: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
  },
  ownerName: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },
  seal: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
  },
});

export interface CertificateData {
  certificateNumber: string;
  companyName: string;
  ownerName: string;
  logoUrl?: string | null;
  facilityName: string;
  facilityAddress: string;
  facilityType: string;
  disinfectionDate: string;
  disinfectionMethod: string;
  chemicalsUsed: string;
  issuedDate: string;
}

export function CertificateTemplate({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            {data.logoUrl ? (
              <Image src={data.logoUrl} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: 700 }}>{data.companyName}</Text>
            )}
          </View>
          <Text style={styles.certNumber}>No. {data.certificateNumber}</Text>
        </View>

        {/* 제목 */}
        <Text style={styles.title}>소 독 증 명 서</Text>

        {/* 테이블 */}
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.labelCell}>시 설 명</Text>
            <Text style={styles.valueCell}>{data.facilityName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>시설 유형</Text>
            <Text style={styles.valueCell}>{data.facilityType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>소독 장소</Text>
            <Text style={styles.valueCell}>{data.facilityAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>소독 일시</Text>
            <Text style={styles.valueCell}>{data.disinfectionDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>소독 방법</Text>
            <Text style={styles.valueCell}>{data.disinfectionMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelCell}>사용 약제</Text>
            <Text style={styles.valueCell}>{data.chemicalsUsed}</Text>
          </View>
          <View style={styles.rowLast}>
            <Text style={styles.labelCell}>소독 업체</Text>
            <Text style={styles.valueCell}>{data.companyName}</Text>
          </View>
        </View>

        {/* 안내문 */}
        <Text style={styles.notice}>
          위와 같이 소독을 실시하였음을 증명합니다.
        </Text>

        {/* 하단 */}
        <View style={styles.footer}>
          <Text style={styles.date}>{data.issuedDate}</Text>
          <Text style={styles.companyName}>{data.companyName}</Text>
          <Text style={styles.ownerName}>대표자: {data.ownerName}</Text>
          <Text style={styles.seal}>(인)</Text>
        </View>
      </Page>
    </Document>
  );
}
