import PageLayout from '../components/PageLayout';
import ChamberView from '../components/chamber/ChamberView';

/** House (435 members) rendered with the shared U-shape ChamberView. */
export default function HousePage() {
  return (
    <PageLayout title="House of Representatives">
      <ChamberView chamber="HOUSE" />
    </PageLayout>
  );
}
