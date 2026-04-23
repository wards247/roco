import './EggGroupSelector.css';

interface EggGroup {
  group_id: number;
  group_display: string;
  description: string;
  member_count: number;
  hatchable_member_count: number;
}

interface Props {
  eggGroups: EggGroup[];
  selectedGroupId: number | null;
  onSelect: (groupId: number | null) => void;
}

const EggGroupSelector = ({ eggGroups, selectedGroupId, onSelect }: Props) => {
  return (
    <div className="egg-group-selector">
      <select
        value={selectedGroupId ?? ''}
        onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
        className="egg-group-selector__select"
        aria-label="选择蛋组"
      >
        <option value="">全部蛋组</option>
        {eggGroups.map((group) => (
          <option key={group.group_id} value={group.group_id}>
            {group.group_display} ({group.member_count})
          </option>
        ))}
      </select>
    </div>
  );
};

export default EggGroupSelector;
