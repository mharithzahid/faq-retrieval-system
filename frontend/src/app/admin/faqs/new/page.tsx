import FaqForm from '@/components/FaqForm';

export default function NewFaqPage() {
  return (
    <div>
      <h1>Add FAQ</h1>
      <FaqForm mode="create" />
    </div>
  );
}
