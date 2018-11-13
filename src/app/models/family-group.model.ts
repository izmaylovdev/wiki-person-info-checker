import IFamilyMember from './family-member.model';
import ICheckResults from './check-results.model';

export default interface IFamilyMemberGroup {
    groupName: string;
    members: Array<IFamilyMember | ICheckResults>;
}
