import { initials } from '../../constants/data';

export function Avatar({ member, size = '' }) {
  return (
    <div className={`avatar ${size}`}>
      {member?.photo_path
        ? <img src={`/${member.photo_path}`} alt="" />
        : initials(member || {})}
    </div>
  );
}
